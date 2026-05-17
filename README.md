# 🎯 Resume Roaster AI

Welcome to **Resume Roaster AI**—the most toxic, unfiltered, and brutal AI-powered resume evaluator on the internet. Built to destroy the egos of overconfident applicants, this app takes your PDF resume and delivers a devastating reality check via a custom-tuned llama-3.1-8b-instant model.

Whether you are a "rockstar full-stack developer" who just graduated or a "game-changing visionary" who relies on Canva templates, Commissioner Roast will find your buzzwords and tear them apart.

## ✨ Features

- **📄 PDF Text Extraction:** Upload your resume (PDF) and the app instantly extracts the text locally using PDF.js.
- **🤖 Brutal AI Roasting (English & Taglish):** Powered by Groq (llama-3.1-8b-instant), the AI delivers a continuous, highly sarcastic, and industry-specific 4-paragraph rant. 
- **📈 Career Concern Index (Intensity Score):** The system calculates an "Intensity Score" (0-100) based on the specific words and insults the AI uses to describe your career.
- **🎭 Hall of Shame:** Got absolutely destroyed? Publish your score and an excerpt of your roast to the public "Hall of Shame" leaderboard for everyone to see.
- **🛡️ Strict Anonymity Protocol:** The AI is strictly programmed to scrub your real name from its memory before generating the roast.
- **⏱️ Rate Limiting:** Built-in rate limiters prevent API spamming for both the AI generation and the Hall of Shame publishing.

## 🛠️ Tech Stack

### Frontend
- **React.js (Vite):** Fast, modern frontend framework.
- **Tailwind CSS:** For sleek, responsive, and customizable styling.
- **PDF.js (pdfjs-dist):** Client-side PDF parsing and text extraction.
- **React Router:** For navigation between the Roaster and the Hall of Shame.
- **Lucide React:** Beautiful SVG icons.

### Backend & Infrastructure
- **Supabase Auth:** Handles user authentication and session management.
- **Supabase Database:** Stores user profiles, application settings, and Hall of Shame entries.
- **Supabase Edge Functions:** Securely proxies requests to the Groq API, keeping API keys hidden from the client.
- **Groq API (llama-3.1-8b-instant):** The brain behind "Commissioner Roast", capable of generating high-speed, dynamic, and hilarious responses.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Supabase Project
- A Groq API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/roast-resume.git
   cd roast-resume
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Setup Supabase Edge Functions (For Groq API):**
   Ensure you have deployed the `/functions/v1/roast` Edge Function in your Supabase project and added your `GROQ_API_KEY` to the Supabase Edge Function secrets.

## 📝 Usage Guidelines
- **Be ready for the burn:** The AI is specifically prompted to be toxic, sarcastic, and unrelenting. It is meant for comedic entertainment.
- **Supported Languages:** Choose between "English" or "Taglish" (a mix of English and conversational street Tagalog).

## 📄 License
This project is for entertainment and portfolio purposes. Do not use this as actual career advice.
