#!/usr/bin/env python3
"""SCP Story Coordinator with Session Support - manages conversation flow between Writer, Reader, and Expert agents."""

import asyncio
import re
import time
import logging
from pathlib import Path
from typing import Optional, Dict, List, Tuple
from datetime import datetime

from agents.base_agent import BaseAgent
from utils import CheckpointManager
from utils.text_sanitizer import sanitize_text
from utils.story_session_manager import StorySessionManager
from themes import get_theme, StoryTheme

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class StoryConfig:
    """Configuration for story parameters with flexible page limits."""
    
    def __init__(self, page_limit: int = 3, words_per_page: int = 300, protagonist_name: Optional[str] = None, model: Optional[str] = None, theme: Optional[str] = None, theme_options: Optional[Dict] = None):
        self.page_limit = page_limit
        self.words_per_page = words_per_page
        self.protagonist_name = protagonist_name
        self.model = model
        self.theme = theme or "scp"
        self.theme_options = theme_options or {}
        self.total_words = page_limit * words_per_page
        self.checkpoint_1_words = int(self.total_words * 0.33)
        self.checkpoint_2_words = int(self.total_words * 0.66)
        
    def get_scope_guidance(self) -> str:
        """Get appropriate scope guidance based on page limit."""
        if self.page_limit <= 3:
            return "a focused, single-scene story with minimal cast"
        elif self.page_limit <= 5:
            return "a story with 2-3 key scenes and small cast"
        elif self.page_limit <= 10:
            return "a multi-scene narrative with developed characters"
        else:
            return "a complex narrative with multiple plot threads"


class SCPCoordinatorSession:
    """Coordinates SCP story writing between Writer, Reader, and Writing Expert agents using session storage."""
    
    def __init__(self, story_config: Optional[StoryConfig] = None, api_key: Optional[str] = None, 
                 session_manager: Optional[StorySessionManager] = None, session_id: Optional[str] = None):
        self.agents: Dict[str, BaseAgent] = {}
        self.story_config = story_config or StoryConfig()
        self.theme: StoryTheme = get_theme(self.story_config.theme)
        self.checkpoint_manager = CheckpointManager()
        self.conversation_history = []
        self.current_speaker = None
        self.turn_count = 0
        self.max_turns = 100  # Increased to allow healthy back-and-forth
        self.story_complete = False
        self.user_request = ""
        self.current_phase = "initialization"
        self.outline_iterations = 0
        self.api_key = api_key  # Store user's OpenRouter API key
        self.session_manager = session_manager
        self.session_id = session_id
        
    def parse_next_speaker(self, message: str) -> Optional[str]:
        """Extract who should speak next from a message."""
        # Look for patterns like [@Writer], [@Reader], [@Expert]
        patterns = [
            r'\[@(\w+)\]',  # [@Writer]
            r'\[Next:\s*(\w+)\]',  # [Next: Reader]
            r'\[(\w+)\'s turn\]',  # [Writer's turn]
            r'@(\w+)',  # @Expert
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                name = match.group(1)
                # Normalize the name - match partial names
                for agent_name in self.agents.keys():
                    if (name.lower() in agent_name.lower() or 
                        agent_name.lower() in name.lower()):
                        return agent_name
        
        # Check for completion signals
        if self.check_story_completion(message):
            self.story_complete = True
            return None
            
        return None
    
    def check_story_completion(self, message: str) -> bool:
        """Check if the story is complete."""
        completion_signals = [
            "[STORY COMPLETE]", 
            "[END]", 
            "[FINISHED]",
            "story is complete and satisfying"
        ]
        return any(signal in message.upper() for signal in completion_signals)
    
    def check_story_approval(self, message: str, agent_name: str = None) -> bool:
        """Check if the Reader or Expert has approved the story."""
        approval_phrases = [
            "I APPROVE this story",
            "I APPROVE the story",
            "story is approved",
            "I approve this story",
            "I approve the story"
        ]
        has_approval = any(phrase.lower() in message.lower() for phrase in approval_phrases)
        
        # Check for Expert's specific technical review approval
        if agent_name == "Expert" and has_approval:
            return "technical review passed" in message.lower()
        
        return has_approval
    
    async def extract_story_from_discussion(self) -> Optional[str]:
        """Extract the latest story from session storage."""
        if not self.session_manager or not self.session_id:
            return None
            
        return self.session_manager.extract_story_from_draft(self.session_id)
    
    def check_for_conflict(self, message: str) -> bool:
        """Check if there's a conflict that needs expert resolution."""
        # Only check for explicit conflicts, not minor disagreements
        conflict_indicators = [
            "strongly disagree",
            "major concern",
            "fundamental issue",
            "cannot accept",
            "this won't work",
            "completely wrong direction"
        ]
        return any(indicator in message.lower() for indicator in conflict_indicators)
    
    def evaluate_outline_scope(self, outline_text: str) -> Tuple[bool, str]:
        """Evaluate if outline complexity matches the page limit."""
        # Count complexity indicators
        scene_count = len(re.findall(r'scene|moment|sequence|vignette|chapter|part', outline_text, re.I))
        character_count = len(re.findall(r'character|protagonist|antagonist|dr\.|mr\.|ms\.|prof\.', outline_text, re.I))
        plot_points = len(re.findall(r'then|next|after|finally|revelation|twist|discovers|realizes', outline_text, re.I))
        detail_count = len(re.findall(r'page \d+|specifically|detailed|extensive|multiple', outline_text, re.I))
        
        # Calculate complexity score
        complexity_score = scene_count + character_count + (plot_points * 0.5) + detail_count
        
        # Expected complexity based on page limit
        max_complexity = self.story_config.page_limit * 5  # Rough heuristic
        
        if complexity_score > max_complexity * 1.5:
            return False, f"This outline appears too complex for {self.story_config.page_limit} pages (complexity score: {complexity_score:.1f}, recommended max: {max_complexity})"
        elif complexity_score > max_complexity:
            return True, f"This outline is ambitious for {self.story_config.page_limit} pages - focus on the core elements during writing"
        else:
            return True, "Outline scope appears appropriate for the target length"
    
    async def check_and_inject_checkpoint(self) -> Optional[str]:
        """Monitor story word count and inject checkpoint prompts."""
        # Extract current story from session
        story_content = await self.extract_story_from_discussion()
        if not story_content:
            return None
            
        word_count = len(story_content.split())
        
        # Check for first checkpoint (1/3 of story)
        if (word_count >= self.story_config.checkpoint_1_words - 50 and 
            not self.checkpoint_manager.checkpoints.get("page_1_review", False)):
            
            pages_done = word_count / self.story_config.words_per_page
            logger.info(f"Triggering first checkpoint at {word_count} words ({pages_done:.1f} pages)")
            self.checkpoint_manager.mark_checkpoint_complete("page_1_checkpoint")
            self.current_phase = "checkpoint_1"
            
            return f"""[CHECKPOINT] You've reached approximately {pages_done:.1f} pages ({word_count} words).
            
Writer: Please pause your writing.
[@Reader]: Please review the story so far and provide feedback on:
- Engagement and atmosphere
- Pacing and flow
- Any concerns or suggestions for the remaining {self.story_config.page_limit - pages_done:.1f} pages"""
        
        # Check for second checkpoint (2/3 of story)
        if (word_count >= self.story_config.checkpoint_2_words - 50 and 
            not self.checkpoint_manager.checkpoints.get("page_2_review", False)):
            
            pages_done = word_count / self.story_config.words_per_page
            remaining_words = self.story_config.total_words - word_count
            logger.info(f"Triggering second checkpoint at {word_count} words ({pages_done:.1f} pages)")
            self.checkpoint_manager.mark_checkpoint_complete("page_2_checkpoint")
            self.current_phase = "checkpoint_2"
            
            return f"""[CRITICAL CHECKPOINT] You've reached approximately {pages_done:.1f} pages ({word_count} words).
            
Writer: Please pause your writing. 
[@Reader]: This is critical - please evaluate:
- Can the story reach a satisfying conclusion in ~{remaining_words} words?
- What plot threads need resolution?
- Is the pacing appropriate for a strong ending?
- Specific suggestions for the conclusion"""
        
        return None
    
    async def initialize_agents(self, user_request: str):
        """Initialize the three agents with appropriate prompts."""
        logger.info("Initializing agents for SCP story creation...")
        self.user_request = user_request
        
        # Create Writer agent using theme
        writer_prompt = self.theme.get_writer_prompt(user_request, self.story_config)
        
        # Append additional universal guidelines to writer prompt
        writer_prompt += f"""

Character Creation:
- Create UNIQUE character names for each story - avoid repetitive patterns
- DO NOT default to "Dr. Chen", "Dr. Sarah Chen", or similar overused names
- Draw from diverse cultural backgrounds and naming conventions
- Vary character roles beyond just "Dr." or "Researcher" 
- Examples for inspiration: Agent Kowalski, Professor Okafor, Specialist Rivera, 
  Dr. Nakamura, Inspector Delacroix, Technician Petrova, Director Hassan
- Consider using given names that reflect different cultures and backgrounds

CRITICAL - Story Writing Process:

PHASE 1 - OUTLINE ONLY:
- When asked for an outline, share ONLY your outline
- DO NOT write the full story yet
- DO NOT use story markers for outlines
- Pass to [@Reader] for feedback on your outline

PHASE 2 - STORY WRITING (After Reader Approval):
- Reader will explicitly say "approved" or "I approve" your outline
- ONLY THEN write your complete story
- YOU MUST use these exact markers:
   ---BEGIN STORY---
   [Your complete story here]
   ---END STORY---
- Include markers on their own lines with no extra spaces
- The story will NOT be saved without BOTH markers exactly as shown
- When revising based on feedback, ALWAYS include the complete story with markers
- Never just describe changes - always provide the full revised text

Scope Guidance:
Your story should be {self.story_config.get_scope_guidance()}.
Create an outline that can realistically fit within {self.story_config.total_words} words.

CRITICAL - Write Like a Human:
Follow these rules ruthlessly to sound natural and authentic:
1. Personal voice - Let your perspective show. Use "I" or "we" when natural in narrative.
2. Kill the filler - Ban "Firstly," "Furthermore," "It is important to note," etc.
3. Vary the rhythm - Mix sentence lengths. Toss in fragments. One-word punches.
4. Active, concrete verbs - "The creature attacked" not "An attack was initiated by the creature"
5. Show, don't tell - Specific details and mini-stories over generalities
6. Surprise me - Break expectations. Avoid predictable patterns.
7. Natural language - Use contractions. Write how people actually think and speak.
8. Skip the obvious - Don't over-explain. Trust your reader's intelligence.
9. End honestly - No canned conclusions or hollow slogans.

Hard bans: excessive passive voice, buzzwords, perfectly balanced structures, robotic transitions, 
LLM-isms like "X wasn't just Y. It was Z", "But here's the thing:", "Little did they know", 
"The truth is,", rhetorical questions with immediate answers.

Awkward literary constructions to avoid:
- Opening with "The [sense] hit [character] first—[list]" 
- Overly dramatic sensory descriptions that prioritize style over clarity
- Dash constructions that create ambiguous relationships
- Trying too hard to be "writerly" instead of clear
Example to avoid: "The smell hit her first—sweat, desperation, and graphite dust"
Better: "The room reeked of sweat and graphite dust" or "She smelled sweat and graphite dust"

Goal: Write stories that feel like a talented human wrote them, not an AI. Good writing is clear first, stylish second.

Note: SCP containment procedures can be clinical, but your NARRATIVE must feel human.

Communication:
- Share your plans and respond to feedback in discussion
- Always indicate who should respond next using [@Reader] or [@Expert]
- Use [@Reader] for normal feedback cycles
- Use [@Expert] only if there's a fundamental disagreement
- When Reader approves your story, they will signal completion

Start by creating an outline appropriate for {self.story_config.page_limit} pages, then wait for Reader feedback before writing."""
        
        # Create Reader agent using theme
        reader_prompt = self.theme.get_reader_prompt(user_request, self.story_config)
        
        # Add universal quality standards
        reader_prompt += f"""

Additional Universal Standards:
- Encourage character diversity - if you notice repetitive names like "Dr. Chen", suggest alternatives
- ENFORCE HUMAN WRITING - Ensure the story sounds like a human wrote it, not AI

Human Writing Standards:
Check for and eliminate:
- Stock AI phrases: "Furthermore," "It is important to note," "In conclusion"
- Perfectly balanced structures and predictable patterns
- Excessive passive voice or academic hedging
- Robotic transitions between paragraphs
- Over-explanation of obvious concepts
- Common LLM-isms:
  * "X wasn't just Y. It was Z." (overused dramatic pattern)
  * "But here's the thing:" or "Here's the thing though:"
  * "Little did they know" (clichéd foreshadowing)
  * Rhetorical questions immediately answered by the writer
- Awkward literary constructions:
  * Sentences that make you pause to figure out what they mean
  * Overly stylized openings that sacrifice clarity
  * Dash/colon usage that creates confusion
  * "Creative" sentence structures that feel forced
  * Flag these as "trying too hard" - good writing is clear first, stylish second

Encourage:
- Natural voice with personality
- Varied sentence rhythms - mix long and short, even fragments
- Active, concrete language with specific details
- Surprising moments and unexpected angles
- Conversational tone where appropriate (contractions, natural flow)
- The "friend-sent-this" vibe - would a human share this story?

"""
        
        # Create Writing Expert agent using theme
        expert_prompt = self.theme.get_expert_prompt(user_request, self.story_config)
        
        # Add universal technical quality standards
        expert_prompt += f"""

Additional Universal Quality Standards:

TECHNICAL QUALITY ASSURANCE (MANDATORY):
- After Writer and Reader both approve, you MUST perform a final technical review
- Check for TECHNICAL issues:
  * Any remaining spelling errors or typos (including joined words like "andthen")
  * Grammar and punctuation issues
  * Formatting consistency
  * Professional presentation
  * Missing spaces after punctuation
  * Incorrect verb tenses or subject-verb disagreements
  * Word count verification - story must be ~{self.story_config.total_words} words
- Check for HUMAN WRITING quality:
  * Does it sound authentically human, not machine-generated?
  * Are there any remaining AI patterns:
    - Stock transitions ("Furthermore," "In conclusion")
    - Perfectly symmetrical structures
    - Excessive passive voice
    - Academic hedging or over-formality
    - Predictable three-part lists everywhere
  * CRITICAL - Detect and eliminate common LLM-isms:
    - "X wasn't just Y. It was Z." (dramatic revelation pattern)
    - "But here's the thing:" (false conversational starter)
    - "Let's be honest/clear" (unnecessary meta-commentary)
    - "It's worth noting that" (filler phrase)
    - "One might argue/say" (academic hedging)
    - "In a world where..." (clichéd opening)
    - "Little did they know" (predictable foreshadowing)
    - "And that's when everything changed" (dramatic cliché)
    - "The truth is," (unnecessary truth-claiming)
    - "To put it simply," (condescending simplification)
    - Rhetorical questions followed by immediate answers
    - Triple patterns everywhere (three examples, three adjectives, three consequences)
    - "Not only X, but also Y" (overly formal construction)
    - Starting multiple sentences with "However," "Moreover," "Indeed"
  * Does it pass the "friend-sent-this" test?
  * Is there personality and natural rhythm in the prose?
- Clarity and Natural Flow Check:
  * Flag any sentences that require re-reading to understand
  * Identify "literary" constructions that feel forced or artificial
  * Even if technically grammatical, reject awkward stylistic choices
  * Ensure prose flows naturally without calling attention to itself
  * Example: "The smell hit her first—sweat, fear, and smoke" is awkward even if grammatical
- If you find ANY issues (technical OR robotic writing):
  * List them specifically with line numbers and suggested rewrites
  * For LLM-isms, explain WHY it sounds artificial and provide natural alternatives
  * Example: "Line 12: LLM-ism detected - 'The door wasn't just locked. It was sealed.' This dramatic revelation pattern is overused by AI. Try: 'The door was sealed tight' or describe the discovery more naturally."
  * Send the story back to [@Writer] for corrections
  * DO NOT approve until all errors are fixed AND the story sounds human
- Check for LENGTH COMPLIANCE:
  * Count the actual words (excluding title)
  * If story is under 85% of target length, this is a critical issue
  * Include in feedback: "Story contains only [X] words but requires ~{self.story_config.total_words} words"
- Only approve with: "I APPROVE this story as Expert - technical review passed"

"""
        
        self.agents = {
            "Writer": BaseAgent("Writer", writer_prompt, model=self.story_config.model, api_key=self.api_key, 
                               session_manager=self.session_manager, session_id=self.session_id),
            "Reader": BaseAgent("Reader", reader_prompt, model=self.story_config.model, api_key=self.api_key,
                               session_manager=self.session_manager, session_id=self.session_id),
            "Expert": BaseAgent("Expert", expert_prompt, model=self.story_config.model, api_key=self.api_key,
                               session_manager=self.session_manager, session_id=self.session_id)
        }
        
        logger.info("All agents initialized successfully")
    
    async def run_story_creation(self, user_request: str):
        """Run the story creation process."""
        await self.initialize_agents(user_request)
        
        # Start with Writer creating outline
        self.current_phase = "outline"
        opening_prompt = f"""Please create a story outline including:
1. Core concept/{self.theme.translate_term("anomaly")}
2. Main character(s)
3. Narrative arc (beginning, middle, end)
4. Key scenes or moments
5. How it will conclude

After sharing your outline, pass to [@Reader] for feedback."""
        
        await self.run_conversation("Writer", opening_prompt)
    
    async def run_conversation(self, opening_speaker: str, opening_prompt: str):
        """Run the multi-agent conversation."""
        logger.info(f"Starting story creation with {opening_speaker}")
        
        self.current_speaker = opening_speaker
        current_prompt = opening_prompt
        
        while self.turn_count < self.max_turns and not self.story_complete:
            self.turn_count += 1
            
            # Check for checkpoint injection
            checkpoint_prompt = await self.check_and_inject_checkpoint()
            if checkpoint_prompt and self.current_speaker == "Writer":
                # Override prompt with checkpoint
                current_prompt = checkpoint_prompt
                # Force next speaker to be Reader
                self.current_speaker = "Reader"
            
            # Get current agent
            if self.current_speaker not in self.agents:
                logger.error(f"Unknown speaker: {self.current_speaker}")
                break
            
            agent = self.agents[self.current_speaker]
            
            # Get response
            logger.info(f"\n--- Turn {self.turn_count}: {self.current_speaker} speaking ---")
            start_time = time.time()
            
            try:
                response = await asyncio.wait_for(
                    agent.respond(current_prompt, skip_callback=True),
                    timeout=120.0  # Increased timeout for story writing
                )
                elapsed = time.time() - start_time
                logger.info(f"{self.current_speaker} responded in {elapsed:.1f}s")
                
            except asyncio.TimeoutError:
                logger.error(f"{self.current_speaker} timed out!")
                break
            
            # Log the response
            self.conversation_history.append({
                "turn": self.turn_count,
                "speaker": self.current_speaker,
                "phase": self.current_phase,
                "response": response,
                "time": elapsed
            })
            
            # Save to session if available
            if self.session_manager and self.session_id:
                # Save agent message
                await self.session_manager.save_message(
                    self.session_id,
                    self.current_speaker,
                    response,
                    self.turn_count,
                    self.current_phase
                )
                
                # Check if response contains a story draft
                has_begin = "---BEGIN STORY---" in response
                has_end = "---END STORY---" in response
                
                if has_begin and has_end:
                    # Save as draft
                    await self.session_manager.save_draft(
                        self.session_id,
                        response,
                        {
                            "agent": self.current_speaker,
                            "phase": self.current_phase,
                            "turn": self.turn_count
                        }
                    )
                    logger.info(f"Draft saved: Found both story markers (turn {self.turn_count})")
                elif has_begin and not has_end:
                    logger.warning(f"Draft NOT saved: Missing END STORY marker (turn {self.turn_count})")
                elif not has_begin and has_end:
                    logger.warning(f"Draft NOT saved: Missing BEGIN STORY marker (turn {self.turn_count})")
                elif self.current_speaker == "Writer" and self.current_phase == "writing":
                    # Writer in writing phase but no markers
                    logger.warning(f"Draft NOT saved: Writer in writing phase but no story markers found (turn {self.turn_count})")
            
            # Response already printed by agent if streaming
            # No need for extra newline since we print complete messages now
            
            # Check for story approval
            if self.check_story_approval(response, self.current_speaker):
                if self.current_speaker == "Reader":
                    logger.info("Reader has approved! Moving to Expert for final technical review.")
                    print(f"\n[SYSTEM]: Reader approved. Moving to Expert for mandatory technical review.")
                    # Force next speaker to be Expert for final review
                    next_speaker = "Expert"
                elif self.current_speaker == "Expert":
                    logger.info("Expert has approved after technical review!")
                    # Extract the story from session and mark complete
                    story_content = await self.extract_story_from_discussion()
                    if story_content and self.session_manager and self.session_id:
                        await self.session_manager.complete_session(self.session_id, story_content)
                        logger.info(f"Story completed and saved to session {self.session_id}")
                        print(f"\n[SYSTEM]: Story approved with technical review passed and saved to session.")
                        self.story_complete = True
                    else:
                        logger.error("Could not extract story from session despite approval")
            
            # Handle outline phase - evaluate scope and limit iterations
            if self.current_phase == "outline":
                # Track outline iterations
                if self.current_speaker == "Writer" and "outline" in response.lower():
                    self.outline_iterations += 1
                    
                    # Evaluate outline scope after Writer provides it
                    if self.outline_iterations == 1:  # First outline
                        scope_ok, scope_msg = self.evaluate_outline_scope(response)
                        if not scope_ok:
                            # Inject scope warning
                            logger.info(f"Outline scope issue: {scope_msg}")
                            print(f"\n[SYSTEM NOTICE]: {scope_msg}")
                            print("Please simplify the outline to fit the target length.\n")
                
                # Check if Reader approved the outline
                if self.current_speaker == "Reader" and ("approved" in response.lower() or "i approve" in response.lower()):
                    self.current_phase = "writing"
                    logger.info(f"Phase transition: outline → writing (Reader approved)")
                    print("\n[SYSTEM]: Reader approved outline. Moving to story writing phase.\n")
            
            # Parse next speaker
            next_speaker = self.parse_next_speaker(response)
            
            if not next_speaker:
                if self.story_complete:
                    logger.info("Story marked as complete")
                else:
                    logger.info("No next speaker indicated - ending conversation")
                break
            
            # Prevent same speaker twice
            if next_speaker == self.current_speaker:
                logger.warning(f"{self.current_speaker} tried to speak again - preventing loop")
                # Pick appropriate alternative
                if self.current_speaker == "Writer":
                    next_speaker = "Reader"
                elif self.current_speaker == "Reader":
                    next_speaker = "Writer"
                else:  # Expert
                    next_speaker = "Writer"  # Default to Writer after Expert decision
            
            # Prepare for next turn
            previous_speaker = self.current_speaker
            self.current_speaker = next_speaker
            
            # Create context for next speaker
            if next_speaker == "Expert":
                # Check if this is final review after Reader approval
                if previous_speaker == "Reader" and self.check_story_approval(response, "Reader"):
                    # Extract the actual story content from the session
                    story_content = await self.extract_story_from_discussion()
                    
                    if not story_content:
                        logger.error("Could not extract story for Expert review despite approvals")
                        current_prompt = f"""The Writer and Reader have both approved the story, but I cannot find the story content in the session.

Please check the conversation history and extract the latest story marked between ---BEGIN STORY--- and ---END STORY--- markers.

{previous_speaker} said: {response}"""
                    else:
                        current_prompt = f"""The Writer and Reader have both approved the story. 

You must now perform a MANDATORY FINAL TECHNICAL REVIEW before the story can be published.

Here is the complete story to review:

---BEGIN STORY---
{story_content}
---END STORY---

Please carefully read the story above and check for:
- Spelling errors and typos (including joined words)
- Grammar and punctuation issues
- Formatting consistency
- Any technical errors that would detract from professional presentation

If you find ANY errors, list them specifically and send back to [@Writer].
If the story passes all technical checks, approve with: "I APPROVE this story as Expert - technical review passed"

{previous_speaker} said: {response}"""
                else:
                    # Expert needs conflict context
                    current_prompt = f"""There appears to be a disagreement that needs resolution.

{previous_speaker} said: {response}

Please review the discussion and make a balanced decision to move the project forward."""
            else:
                # Regular handoff
                # Check if this is Writer's turn after Reader approval
                if (next_speaker == "Writer" and self.current_phase == "writing" and 
                    previous_speaker == "Reader" and ("approved" in response.lower() or "i approve" in response.lower())):
                    current_prompt = f"""The Reader has approved your outline! 

Now write the complete story following these requirements:
1. Write the full story (~{self.story_config.total_words} words)
2. MANDATORY: Wrap your story with these exact markers:
   ---BEGIN STORY---
   [Your complete story here]
   ---END STORY---
3. Include the ENTIRE story between the markers
4. The markers must be on their own lines with no extra spaces
5. Pass to [@Reader] when complete

{previous_speaker} said: {response}"""
                else:
                    current_prompt = f"{previous_speaker} said: {response}\n\nPlease respond."
        
        logger.info(f"\nStory creation ended after {self.turn_count} turns")
        self.print_summary()
    
    def print_summary(self):
        """Print conversation summary."""
        print("\n" + "="*60)
        print("STORY CREATION SUMMARY")
        print("="*60)
        
        total_time = sum(turn["time"] for turn in self.conversation_history)
        print(f"Total turns: {len(self.conversation_history)}")
        print(f"Total time: {total_time:.1f}s ({total_time/60:.1f} minutes)")
        print(f"Average time per turn: {total_time/len(self.conversation_history):.1f}s")
        
        # Phase breakdown
        phase_stats = {}
        for turn in self.conversation_history:
            phase = turn.get("phase", "unknown")
            if phase not in phase_stats:
                phase_stats[phase] = {"count": 0, "time": 0}
            phase_stats[phase]["count"] += 1
            phase_stats[phase]["time"] += turn["time"]
        
        print("\nPhase breakdown:")
        for phase, stats in phase_stats.items():
            print(f"  {phase}: {stats['count']} turns, {stats['time']:.1f}s total")
        
        # Speaker statistics
        speaker_stats = {}
        for turn in self.conversation_history:
            speaker = turn["speaker"]
            if speaker not in speaker_stats:
                speaker_stats[speaker] = {"count": 0, "total_time": 0}
            speaker_stats[speaker]["count"] += 1
            speaker_stats[speaker]["total_time"] += turn["time"]
        
        print("\nSpeaker statistics:")
        for speaker, stats in speaker_stats.items():
            avg_time = stats["total_time"] / stats["count"]
            print(f"  {speaker}: {stats['count']} turns, avg {avg_time:.1f}s/turn")
        
        # Check final story status
        if self.session_id:
            print(f"\nSession ID: {self.session_id}")
            if self.story_complete:
                print("Story status: COMPLETED")
            else:
                print("Story status: IN PROGRESS")
        
        print("\n" + "="*60)


async def main():
    """Run the SCP story creation."""
    # This is for testing only - in production, use the WebSocket handler
    from supabase import create_client
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    # Initialize Supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    supabase = create_client(supabase_url, supabase_key)
    
    # Create session manager
    from utils.story_session_manager import StorySessionManager
    session_manager = StorySessionManager(supabase)
    
    # Create a test session
    test_user_id = "test-user-123"
    session_id = await session_manager.create_session(test_user_id, {
        "theme": "scp",
        "page_limit": 3,
        "model": "default"
    })
    
    # Create coordinator
    coordinator = SCPCoordinatorSession(
        session_manager=session_manager,
        session_id=session_id
    )
    
    # Example request
    user_request = "Write an SCP story about a library where books rewrite themselves based on who reads them"
    
    print("\n" + "="*60)
    print("SCP STORY CREATION SYSTEM (Session-Based)")
    print("="*60)
    print(f"Request: {user_request}")
    print(f"Session ID: {session_id}\n")
    
    await coordinator.run_story_creation(user_request)


if __name__ == "__main__":
    asyncio.run(main())