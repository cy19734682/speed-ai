import {NextRequest, NextResponse} from "next/server";
import { getTools } from "@/app/lib/mcp-service";

export async function POST(req: NextRequest) {
  try {
    const params = await req.json()
    const tools = await getTools(params);
    return NextResponse.json(tools);
  } catch (error: any) {
    console.error("获取工具错误:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
