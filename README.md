# Website Builder with React & Express

## Overview
This project is a **Website Builder** that generates websites dynamically based on user prompts. It is built using:
- **React** for the frontend
- **Express** for the backend
- **Google Gemini API** for AI-powered content generation
- **WebContainers** to run code directly in the client's browser

## Features
- Accepts user input prompts to generate a website
- Uses the **Gemini API** for AI-assisted website creation
- Dynamically generates code and structures files accordingly
- Provides a **code editor (Monaco Editor)** for modifications
- Offers a **preview mode** for real-time visualization
- Implements a file explorer for easy navigation
- Supports **downloading** generated projects as zip files
- Uses **WebContainers** to run code directly in the client's browser

## Tech Stack
- **Frontend:** React, TypeScript, Monaco Editor, Lucide Icons
- **Backend:** Express, Node.js
- **AI Integration:** Google Gemini API
- **Browser Execution:** WebContainers

## Installation & Setup
### Prerequisites
Ensure you have the following installed:
- Node.js (>= 16.x)
- npm or yarn

### Steps to Run the Project
1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/website-builder.git
   cd website-builder
   ```
2. Install dependencies for both frontend and backend:
   ```sh
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add your **Google Gemini API key**:
     ```env
     GEMINI_API_KEY=your-api-key-here
     ```
4. Start the backend server:
   ```sh
   cd backend
   node server.js
   ```
5. Start the frontend development server:
   ```sh
   cd frontend
   npm start
   ```
6. Open the application in your browser at `http://localhost:3000`

## Usage
1. Enter a website description or prompt.
2. The AI generates a structured website code based on the prompt.
3. Modify the generated code using the **Monaco Editor**.
4. Preview the website in real-time.
5. Download the generated website as a zip file.
6. Save and export your project files.
7. Run code directly in the browser using **WebContainers**.

## API Endpoints
### `POST /template`
- **Description:** Processes user prompt and returns AI-generated code.
- **Request Body:**
  ```json
  {
    "prompt": "A modern portfolio website with a contact form"
  }
  ```
- **Response:**
  ```json
  {
    "code": "<html>...</html>",
    "structure": {...}
  }
  ```

### `GET /download`
- **Description:** Downloads the generated project as a zip file.
- **Response:**
  - A zip file containing the generated website structure.

## Current Issues
The website is currently experiencing some issues. We appreciate any contributions to help resolve them!

## Future Improvements
- Improve AI response accuracy for complex prompts
- Add support for different frontend frameworks (Vue, Angular)
- Implement user authentication for project management
- Enable deployment of generated websites
- Enhance file explorer with drag-and-drop support

## Contributing
Feel free to submit pull requests and open issues to improve the project! Contributions to the **README** are also welcome.



