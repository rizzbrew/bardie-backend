---
title: Bardie Api
emoji: 🔥
colorFrom: red
colorTo: green
sdk: docker
pinned: false
license: mit
short_description: Function API Scrape Google Gemini
---

# Bardie Backend

Bardie Backend is a Node.js based API wrapper that scrapes **Google Gemini** to provide a simple backend service for conversational AI and multimodal queries.  
It supports text prompts, optional image inputs (via URL or base64), and preview image responses.

## Features
- Ask Google Gemini via API.
- Supports text-only and text+image inputs.
- Image upload handling with Google content-push APIs.
- Preview mode for direct image response.
- Swagger UI documentation included.
- Docker support for easy deployment.
- Built-in request logging with colors and response size display.

## Project Structure
```
 bard.js          # Core Bard class handling Gemini requests
 config.json      # Configuration file (cookies, schemes, image limit)
 index.js         # Express server with API endpoints
 swagger.json     # API schema for Swagger UI
 package.json     # Dependencies and project metadata
 Dockerfile.txt   # Docker build file
 README.md        # Project info
```

## Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/rizzbrew/bardie-backend.git
cd bardie-backend
npm install
```

## Configuration
Edit **config.json**:
```json
{
  "bl": "boq_assistant-bard-web-server_20250901.13_p1",
  "cookie": "your_cookie_here",
  "schemes": "https",
  "imageUploadLimit": 10
}
```

- **cookie**: Required for authentication (`__Secure-1PSID` token).
- **schemes**: Use `https` for deployment.
- **imageUploadLimit**: Max number of images allowed per request, default 10 max image in gemini server.

## Running the Server
Start locally:
```bash
npm start
```

Server runs at:  
**http://localhost:7860**

## Docker Deployment
Build and run with Docker:
```bash
docker build -t bardie-backend -f Dockerfile.txt .
docker run -p 7860:7860 bardie-backend
```

## API Usage
### Endpoint: `/backend/conversation`
**Method:** `POST`

**Request Body:**
```json
{
  "ask": "Hello Bardie!",
  "image": "https://example.com/sample.png",
  "preview": false
}
```

**Response:**
```json
{
  "content": "Hello! How can I help you today?",
  "status": 200,
  "creator": "RizzyFuzz"
}
```

- `ask`: Text question (required).
- `image`: Optional image URL or base64 string.
- `preview`: If true and response is an image, returns raw image instead of JSON.

## Swagger Documentation
The API includes Swagger UI for interactive testing.  
Access it via `http://localhost:7860/`.

## Author
- **RizzyFuzz**  
  Website: [https://www.rizzy.eu.org/](https://www.rizzy.eu.org/)  
  Email: support@rizzy.eu.org

## License
This project is licensed under the **MIT License**.
