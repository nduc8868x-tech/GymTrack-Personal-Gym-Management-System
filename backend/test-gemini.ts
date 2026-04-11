import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyBGX0zn7WUc3TKYDI-MHAUhqMsKQiS-yLo");

async function main() {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      systemInstruction: 'You are a test agent.',
    });
    const chat = model.startChat();
    const stream = await chat.sendMessageStream('Hello!');
    for await (const chunk of stream.stream) {
      process.stdout.write(chunk.text());
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
