import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";
import fs from "fs/promises";
import readline from "readline";
import { formatResponse } from "./utils/formatResponse.js";

dotenv.config();

const openai = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0.7 });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  const systemPrompt = await fs.readFile("./prompts/system-prompt.txt", "utf-8");

  rl.question("🧑‍🔧 ¿Qué necesitás saber?\n", async (input) => {
    const response = await openai.call([
      new SystemMessage(systemPrompt),
      new HumanMessage(input)
    ]);

    console.log(formatResponse(response.content));
    rl.close();
  });
}

main();
