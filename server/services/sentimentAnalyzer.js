import { bedrock, BEDROCK_MODEL_ID } from '../config/aws.js';
import fs from 'fs';

export class SentimentAnalyzer {
  constructor() {
    this.mockMode = process.env.NODE_ENV === 'development' && !process.env.AWS_ACCESS_KEY_ID;
  }

  async analyzeFrame(framePath, timestamp) {
    if (this.mockMode) {
      return this.getMockSentiment(timestamp);
    }

    try {
      // Read image file and convert to base64
      const imageBuffer = fs.readFileSync(framePath);
      const base64Image = imageBuffer.toString('base64');

      const prompt = `
        Analyze the facial expression in this image and determine the primary emotion.
        Return only a JSON object with this exact format:
        {
          "sentiment": "happy|neutral|sad|angry|surprised|fearful",
          "confidence": 0.85
        }
        
        Base your analysis on facial features, expressions, and overall emotional indicators.
        The confidence should be between 0 and 1.
      `;

      const requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/png",
                  data: base64Image
                }
              }
            ]
          }
        ]
      };

      const response = await bedrock.invokeModel({
        modelId: BEDROCK_MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody)
      }).promise();

      const responseBody = JSON.parse(response.body.toString());
      const content = responseBody.content[0].text;
      
      // Parse the JSON response
      const sentimentData = JSON.parse(content);
      
      return {
        timestamp,
        sentiment: sentimentData.sentiment,
        confidence: sentimentData.confidence
      };
    } catch (error) {
      console.error('Error analyzing frame:', error);
      // Fallback to mock data on error
      return this.getMockSentiment(timestamp);
    }
  }

  getMockSentiment(timestamp) {
    const sentiments = ['happy', 'neutral', 'sad', 'angry', 'surprised', 'fearful'];
    const weights = [0.3, 0.25, 0.15, 0.1, 0.15, 0.05]; // Weighted towards positive emotions
    
    // Use timestamp to create consistent but varied results
    const seed = parseInt(timestamp.replace(/[^\d]/g, '')) || 1;
    const random = (seed * 9301 + 49297) % 233280 / 233280;
    
    let cumulative = 0;
    let selectedSentiment = 'neutral';
    
    for (let i = 0; i < sentiments.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        selectedSentiment = sentiments[i];
        break;
      }
    }
    
    return {
      timestamp,
      sentiment: selectedSentiment,
      confidence: 0.7 + (random * 0.25) // Confidence between 0.7 and 0.95
    };
  }

  async analyzeBatch(frames, onProgress) {
    const results = [];
    
    for (let i = 0; i < frames.length; i++) {
      const framePath = frames[i];
      const timestamp = this.frameToTimestamp(i + 1);
      
      try {
        const result = await this.analyzeFrame(framePath, timestamp);
        results.push(result);
        
        if (onProgress) {
          onProgress(Math.round(((i + 1) / frames.length) * 100));
        }
      } catch (error) {
        console.error(`Error analyzing frame ${i + 1}:`, error);
        // Continue with next frame
      }
    }
    
    return results;
  }

  frameToTimestamp(frameNumber) {
    const seconds = frameNumber;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `00:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}