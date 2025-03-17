import fs from 'fs';
import path from 'path';
import util from 'util';

// Create a logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create logs directory:', err);
  }
}

/**
 * Enhanced logger for more detailed error tracking
 */
export const logger = {
  info: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[INFO] [${timestamp}] ${message}`;
    console.log(formattedMessage, meta ? util.inspect(meta, { depth: 5, colors: false }) : '');
    
    // Also write to file
    try {
      const logFile = path.join(logsDir, 'app.log');
      fs.appendFileSync(
        logFile,
        `${formattedMessage} ${meta ? JSON.stringify(meta, null, 2) : ''}\n`
      );
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  },
  
  error: (message: string, error?: any, meta?: any) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[ERROR] [${timestamp}] ${message}`;
    
    // Log to console
    console.error(formattedMessage);
    
    if (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
        console.error(`Stack: ${error.stack}`);
      } else {
        console.error('Error details:', error);
      }
    }
    
    if (meta) {
      console.error('Additional context:', util.inspect(meta, { depth: 5, colors: false }));
    }
    
    // Write to file
    try {
      const logFile = path.join(logsDir, 'error.log');
      let logContent = `${formattedMessage}\n`;
      
      if (error) {
        if (error instanceof Error) {
          logContent += `Error: ${error.message}\nStack: ${error.stack}\n`;
        } else {
          logContent += `Error details: ${JSON.stringify(error, null, 2)}\n`;
        }
      }
      
      if (meta) {
        logContent += `Additional context: ${JSON.stringify(meta, null, 2)}\n`;
      }
      
      fs.appendFileSync(logFile, logContent + '\n');
    } catch (err) {
      console.error('Failed to write to error log file:', err);
    }
  },
  
  apiError: (message: string, apiResponse?: any) => {
    // Special logging function for API errors
    const meta: any = { timestamp: new Date().toISOString() };
    
    if (apiResponse) {
      if (apiResponse.response) {
        // Axios error format
        meta.status = apiResponse.response.status;
        meta.statusText = apiResponse.response.statusText;
        meta.headers = apiResponse.response.headers;
        meta.data = apiResponse.response.data;
        meta.url = apiResponse.config?.url;
        meta.method = apiResponse.config?.method;
      } else {
        // Generic API response
        meta.response = apiResponse;
      }
    }
    
    // Log to console and file
    logger.error(`API Error: ${message}`, null, meta);
    
    // Also write to a specific API errors log
    try {
      const logFile = path.join(logsDir, 'api-errors.log');
      fs.appendFileSync(
        logFile,
        `[${meta.timestamp}] ${message}\n${JSON.stringify(meta, null, 2)}\n\n`
      );
    } catch (err) {
      console.error('Failed to write to API error log file:', err);
    }
  },
  
  replicate: (message: string, params?: any, error?: any) => {
    // Special logging function for Replicate API interactions
    const timestamp = new Date().toISOString();
    const logEntry: any = {
      timestamp,
      message,
      params: params ? { ...params } : undefined,
    };
    
    // Remove sensitive information if present
    if (logEntry.params?.auth) {
      logEntry.params.auth = '[REDACTED]';
    }
    
    if (error) {
      logEntry.error = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error;
    }
    
    console.log(`[REPLICATE] [${timestamp}] ${message}`);
    if (params) {
      const sanitizedParams = { ...params };
      if (sanitizedParams.auth) sanitizedParams.auth = '[REDACTED]';
      console.log('Params:', util.inspect(sanitizedParams, { depth: 5, colors: false }));
    }
    
    if (error) {
      console.error('Error:', error);
    }
    
    // Write to Replicate-specific log file
    try {
      const logFile = path.join(logsDir, 'replicate.log');
      fs.appendFileSync(
        logFile,
        `[${timestamp}] ${message}\n${JSON.stringify(logEntry, null, 2)}\n\n`
      );
    } catch (err) {
      console.error('Failed to write to Replicate log file:', err);
    }
  }
};

export default logger; 