export class Agent {
  constructor(private config: any) {}
  async run(prompt: string): Promise<any> {
    return { output: "Cursor SDK not available" };
  }
}

export default { Agent };
