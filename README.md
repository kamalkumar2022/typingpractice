# Productively Learn Typing with AI

A modern typing practice application that helps you improve your typing speed and accuracy while learning about topics that interest you through AI-generated content.

<!-- ![Typing Test Screenshot](images/ai.png) -->

## Overview

This application combines typing practice with AI-powered content generation to create a productive learning experience. Instead of typing meaningless text, users can generate content about topics they're interested in, making practice sessions more engaging and educational.

The application also features a sophisticated error detection system that fixes the "Half/Full Mistakes" problem found in many existing typing websites, providing more accurate and helpful feedback to users, specially for those who are preparing for government exams.

## Key Features

### 🤖 AI Content Generation

Integration with Gemini AI allows users to generate custom practice content about virtually any topic:

- **General Knowledge**: Learn facts while practicing typing
- **Vocabulary**: Improve vocabulary while enhancing typing skills
- **Short Stories**: Type engaging narrative content
- **Custom Topics**: Generate content on specific subjects by providing prompts:
  - Technical tutorials
  - Interview Q&As
  - Poetry and literature
  - Historical information
  - And much more!

### 🔍 Advanced Error Detection System

The application features a unique "Half/Full Mistakes" classification system that provides more accurate feedback than conventional typing tests:

#### Full Mistakes (Major Errors)

These errors significantly impact readability and meaning:

1. **Omission Errors**: Words completely skipped during typing
2. **Substitution Errors**: Replacing words with different words
3. **Addition Errors**: Extra words typed that weren't in the original
4. **Spelling Errors**: Words with incorrect spelling
5. **Repetition Errors**: Words typed multiple times unnecessarily
6. **Incompletion Errors**: Words started but not fully typed

#### Half Mistakes (Minor Errors)

These errors are less severe but still affect quality:

1. **Spacing Errors**: Incorrect spacing between words
2. **Capitalization Errors**: Incorrect use of uppercase/lowercase
3. **Punctuation Errors**: Missing or incorrect punctuation
4. **Transposition Errors**: Words or characters in wrong order
5. **Paragraphic Errors**: Incorrect paragraph formatting or indentation

This classification system provides a more nuanced and educational assessment than the simple "correct/incorrect" binary used by most typing websites.

## Practice Modes

- **Practice Mode**: Standard mode with all features enabled
- **Exam Mode**: Simulates testing conditions with stricter rules
- **Blur Mode**: Input text is blurred to encourage touch typing skills

## Comprehensive Analysis

After each test, receive detailed performance metrics:

- Words per Minute (WPM) and Keys per Minute (KPM)
- Overall accuracy percentage
- Character-level analysis (correct, wrong, extra, missing)
- Word-level analysis with categorized mistakes
- Visual indicators highlighting specific error types

## Text Management

- Save frequently used texts for future practice
- View and organize saved texts
- Upload text files
- Copy texts to clipboard
- Edit saved texts

## Getting Started

1. Choose between "Predefined Text" or "Custom Text"
2. If using custom text:
   - Enter your own text
   - Upload a text file
   - Generate AI content by selecting a topic
   - For custom AI generation, enter a prompt describing your desired content
3. Configure your test settings:
   - Word limit
   - Time limit
   - Test mode
4. Click "Start Test" to begin your typing practice session
5. Type the displayed text, receiving real-time feedback
6. Review your detailed results and mistake analysis

## Technical Details

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js
- **AI Integration**: Gemini AI through API endpoints
- **Storage**: localStorage for saving texts and user preferences
- **Text Processing**: Sophisticated algorithms for error detection and classification

## Why This Application Is Different

Most typing websites focus solely on speed metrics without providing meaningful content or accurate error analysis. This application addresses both limitations:

1. **Learning While Typing**: AI-generated content makes practice sessions educational
2. **Accurate Error Analysis**: The Half/Full Mistakes system provides more helpful feedback than traditional WPM-focused tests

By combining these innovations, this application transforms typing practice from a mechanical exercise into a productive learning experience.
