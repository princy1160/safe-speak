import { pipeline, env } from '@xenova/transformers';

// Configure transformer settings for server environment
env.useBrowserCache = false;
env.backends.onnx.wasm.numThreads = 1;

export interface ContentAnalysisResult {
  isVulgar: boolean;
  isCrisis: boolean;
  highlightedContent?: string;
  crisisType?: 'suicide' | 'depression' | 'general';
}

// Define vulgar words and crisis keywords for rule-based detection
const vulgarWords = [
  'stupid', 'idiot', 'hate', 'damn', 'shit', 'fuck', 'ass', 'bitch', 'bastard',
  'crap', 'hell', 'jerk', 'moron', 'dumb', 'retard', 'loser', 'asshole', 'dick'
];

const suicideKeywords = [
  'suicide', 'kill myself', 'end my life', 'don\'t want to live', 'take my own life',
  'want to die', 'better off dead', 'shouldn\'t be alive', 'no reason to live'
];

const depressionKeywords = [
  'depression', 'depressed', 'hopeless', 'worthless', 'empty', 'meaningless',
  'can\'t go on', 'tired of living', 'pointless', 'no future', 'overwhelmed', 'exhausted'
];

// Classification models
let toxicityClassifier: any = null;
let sentimentClassifier: any = null;

// Initialize models
async function initModels() {
  try {
    // Load toxicity detection model
    toxicityClassifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-toxic');
    console.log('Toxicity classifier loaded successfully');
    
    // Load sentiment analysis model (useful for depression detection)
    sentimentClassifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    console.log('Sentiment classifier loaded successfully');
  } catch (error) {
    console.error('Error loading NLP models:', error);
    console.log('Using fallback rule-based analysis only');
  }
}

// Start loading models in background
initModels();


export async function analyzeContent(content: string): Promise<ContentAnalysisResult> {
  let isVulgar = false;
  let isCrisis = false;
  let highlightedContent = content;
  let crisisType: 'suicide' | 'depression' | 'general' | undefined;
  
  // STEP 1: Rule-based detection for vulgar content
  for (const word of vulgarWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(content)) {
      isVulgar = true;
      highlightedContent = highlightedContent.replace(
        regex,
        `<span class="vulgar-highlight">$&</span>`
      );
    }
  }
  
  // STEP 2: Rule-based detection for crisis indicators
  
  // Check for suicide indicators
  const hasSuicideKeywords = suicideKeywords.some(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (hasSuicideKeywords) {
    isCrisis = true;
    crisisType = 'suicide';
  } else {
    // If not suicide, check for depression indicators
    const hasDepressionKeywords = depressionKeywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasDepressionKeywords) {
      isCrisis = true;
      crisisType = 'depression';
    }
  }
  
  // STEP 3: ML-based detection if classifiers are loaded
  try {
    // Enhance vulgar detection with ML
    if (toxicityClassifier && !isVulgar) {
      const toxicityResult = await toxicityClassifier(content);
      // If toxicity classification is high, mark as vulgar
      if (toxicityResult[0].label === 'toxic' && toxicityResult[0].score > 0.7) {
        isVulgar = true;
        // Since we don't know which specific words triggered the toxicity,
        // we'll highlight the entire message
        highlightedContent = `<span class="vulgar-highlight">${content}</span>`;
      }
    }
    
    // Enhance depression detection with sentiment analysis
    if (sentimentClassifier && !isCrisis) {
      const sentimentResult = await sentimentClassifier(content);
      
      // If sentiment is very negative and content is at least moderately long
      // (to avoid false positives on short negative statements)
      if (sentimentResult[0].label === 'NEGATIVE' && 
          sentimentResult[0].score > 0.9 && 
          content.split(' ').length > 10) {
        
        isCrisis = true;
        crisisType = 'depression';
      }
    }
  } catch (error) {
    console.error('Error during ML analysis:', error);
    // Continue with rule-based results
  }
  
  // If crisis but type not determined, set as general
  if (isCrisis && !crisisType) {
    crisisType = 'general';
  }
  
  return {
    isVulgar,
    isCrisis,
    highlightedContent: isVulgar ? highlightedContent : undefined,
    crisisType: isCrisis ? crisisType : undefined
  };
}


export function generateCrisisResponse(crisisType: string): string {
  const responses = {
    suicide: "I notice you're having some difficult thoughts. Please know that you're not alone, and help is available. Taking a deep breath and reaching out to someone you trust can be a good first step. Would you like to talk to a counselor?",
    
    depression: "It sounds like you might be going through a tough time. Remember that your feelings are valid, but they don't define you. Small steps like reaching out, as you've done now, are important. Would you like some resources that might help?",
    
    general: "Thank you for sharing how you're feeling. It takes courage to speak up when things are difficult. A counselor would be a good person to talk with about these feelings. Would you like some support options?"
  };
  
  return responses[crisisType as keyof typeof responses] || responses.general;
}



