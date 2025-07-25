# SCP Writer - Multi-Agent Story Creation with OpenRouter

A collaborative AI system that uses three specialized agents powered by OpenRouter to write narrative-style SCP (Secure, Contain, Protect) stories. Choose from 20+ AI models including GPT-4.1, Claude 4, Gemini 2.5, and more.

## 🌟 Features

- **🤖 Multi-Model Support**: Access 20+ AI models via OpenRouter (OpenAI, Anthropic, Google, Meta, etc.)
- **🎨 Custom Terminal UI**: Immersive SCP Foundation terminal theme with ASCII art
- **🎯 Model Selection**: Terminal-themed dropdown with model descriptions and cost indicators
- **📡 Real-Time Streaming**: Live message streaming from any selected model
- **💾 Export Options**: Download agent logs and full sessions in multiple formats (TXT, JSON, MD)
- **🎭 Three-Agent System**: Writer, Reader, and Expert collaborate for quality stories
- **📏 Flexible Length**: Support for 1-10 page stories with adaptive checkpoints
- **🔄 Interactive Mode**: Easy story configuration with guided prompts
- **📊 Progress Monitoring**: Optional real-time agent activity tracking
- **🧹 Auto-Cleanup**: Fresh start with each run

## 📸 Screenshots

<details>
<summary>Terminal Interface</summary>

The web interface features an authentic SCP Foundation terminal aesthetic with:
- Green-on-black terminal theme
- ASCII art borders and UI elements
- Real-time agent status indicators
- Custom model selection dropdown
</details>

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+ (for web interface)
- OpenRouter API key from [openrouter.ai](https://openrouter.ai/)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/japhet19/scpwriter.git
cd scpwriter
```

2. **Set up environment**
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your OpenRouter API key
# OPENROUTER_API_KEY=your-api-key-here
```

3. **Backend Setup**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r api/requirements.txt  # For web interface
```

4. **Frontend Setup** (for web interface)
```bash
cd frontend
npm install
```

## 💻 Usage

### Web Interface (Recommended)

1. **Start the backend API:**
```bash
source venv/bin/activate
python api/main.py
```

2. **In a new terminal, start the frontend:**
```bash
cd frontend
npm run dev
```

3. **Open your browser:**
Navigate to http://localhost:3000

4. **Generate a story:**
   - Enter your anomaly theme
   - Select AI model from the dropdown
   - Choose story length (1-10 pages)
   - Configure additional options
   - Click "INITIATE DOCUMENTATION"

### Command Line Interface

```bash
# Interactive mode (recommended)
python main.py

# With theme
python main.py "A memetic hazard that spreads through dreams"

# Specify options
python main.py --pages 5 --monitor "Your theme here"
```

## 🤖 Available Models

### Premium (Recommended)
- **Claude 4 Opus** - Most powerful, exceptional creative writing (1M context)
- **Claude 4 Sonnet** - Balanced performance and cost (200K context)
- **Claude 3.5 Sonnet** - Previous generation, still excellent (200K context)

### High Performance
- **GPT-4.1** - Latest GPT-4 with improved performance (1M context)
- **GPT-4o** - Optimized for faster responses (128K context)
- **O4-mini** - Fast reasoning model with multimodal support (200K context)

### Google Models
- **Gemini 2.5 Pro** - Massive 1M token context window
- **Gemini 2.5 Flash** ⭐ - Fast and cost-effective (1M context) - **Default**

### Cost-Effective
- **GPT-3.5 Turbo** - Fast and affordable (16K context)
- **Llama 3.1 70B** - Open-source powerhouse (128K context)
- **Mistral Large** - Competitive open model (32K context)

## ⚙️ Configuration

### API Key Setup

1. Get your API key from [OpenRouter](https://openrouter.ai/)
2. Add to `.env` file:
```env
OPENROUTER_API_KEY=your-api-key-here
```

### Default Model

The default model is Gemini 2.5 Flash for cost-effectiveness. To change:
```env
OPENROUTER_MODEL=anthropic/claude-opus-4-20250514
```

## 📁 Project Structure

```
scpwriter/
├── agents/          # Agent implementations with OpenRouter integration
├── api/             # FastAPI backend for web interface
├── frontend/        # Next.js web interface with terminal aesthetic
├── utils/           # Text sanitization, checkpoints, monitoring
├── prompts/         # Agent prompt templates
├── discussions/     # Agent communication logs
├── output/          # Generated stories
├── main.py          # CLI entry point
└── scp_coordinator.py  # Agent orchestration logic
```

## 🔄 How It Works

1. **User Input**: Provide an anomaly theme and select AI model
2. **Agent Initialization**: Three agents are created with specialized prompts
3. **Story Planning**: Writer creates outline, Reader provides feedback
4. **Iterative Writing**: Story develops through agent collaboration
5. **Quality Control**: Reader ensures word count and quality standards
6. **Expert Arbitration**: Resolves disputes when agents disagree
7. **Final Output**: Polished SCP story saved to output directory

## 🎯 Agent Roles

- **Writer**: Creative force, develops story concepts and writes narrative
- **Reader**: Quality control, ensures coherence and SCP format compliance  
- **Expert**: Arbitrator, resolves conflicts and ensures progress

## 📝 Story Configuration

- **Theme**: Any anomalous concept (objects, entities, phenomena)
- **Length**: 1-10 pages (300 words per page)
- **Style**: Narrative format like "There Is No Antimemetics Division"
- **Model**: Choose from 20+ AI models based on needs

## 🛠️ Development

### Tech Stack
- **Backend**: Python, FastAPI, AsyncIO
- **Frontend**: Next.js, React, TypeScript
- **AI**: OpenRouter API (OpenAI SDK compatible)
- **Styling**: CSS Modules, Terminal aesthetic

### Contributing
Pull requests welcome! Please ensure:
- Code follows existing patterns
- Terminal theme is maintained
- Tests pass (when added)

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- OpenRouter for unified AI model access
- SCP Foundation community for inspiration
- Terminal UI aesthetic inspired by classic computer terminals

---

*Remember: Secure. Contain. Protect.*