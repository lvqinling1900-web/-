
import { GoogleGenAI } from "@google/genai";
import { ISOResult } from "../types";

export const analyzeTestResults = async (results: ISOResult): Promise<string> => {
  // Use gemini-3-pro-preview for complex metrology reasoning and STEM tasks
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    作为计量院资深工程师，请分析以下直驱转台的测试数据（ISO 230-2标准）：
    
    测试结果：
    - 双向定位精度 (A): ${results.A.toFixed(2)} "
    - 重复定位精度 (R): ${results.R.toFixed(2)} "
    - 反向差值 (B): ${results.B.toFixed(2)} "
    - 定位偏差 (E): ${results.E.toFixed(2)} "
    
    数据详情：
    ${results.points.map(p => `角度 ${p.angle}°: 正向偏差 ${p.meanForward.toFixed(2)}", 反向偏差 ${p.meanReverse.toFixed(2)}"`).join('\n')}
    
    请提供：
    1. 精度评价（是否合格，通常直驱转台精度在1-5秒以内）。
    2. 误差原因分析（如：周期性误差可能源于编码器安装偏心、反向误差大可能源于控制算法或轴承预紧）。
    3. 维护建议。
    4. 简短总结。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    // Property access .text is correct for GenerateContentResponse
    return response.text || "未能生成分析报告。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 分析服务暂不可用。";
  }
};
