// vercel-moments-api/api/publish.js
// 引入依赖
const { Octokit } = require('octokit');
const cors = require('cors');

// 1. 解决跨域（测试阶段允许所有域名，后续可限制）
const corsHandler = cors({ origin: '*' });

// 2. 主函数（Vercel 会自动识别这个导出的函数）
module.exports = async (req, res) => {
  // 处理跨域
  await new Promise((resolve) => corsHandler(req, res, resolve));

  // 3. 初始化 GitHub 客户端（从 Vercel 环境变量读取 Token）
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  // 4. 读取 Vercel 环境变量（后续在控制台配置）
  const REPO_OWNER = process.env.REPO_OWNER; // 你的 GitHub 用户名（小写）
  const REPO_NAME = process.env.REPO_NAME;   // 数据仓库名（如 moments-data）
  const PUBLISH_PWD = process.env.PUBLISH_PWD; // 自定义发布密码

  // ====================== 第一步：先验证接口能访问 ======================
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: '接口已正常访问！',
      tip: '请用 POST 请求发布动态'
    });
  }

  // ====================== 第二步：处理 POST 发布请求 ======================
  if (req.method === 'POST') {
    try {
      // 验证环境变量是否配置（防止漏配）
      if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME || !PUBLISH_PWD) {
        return res.status(500).json({
          success: false,
          error: 'Vercel 环境变量未配置完整'
        });
      }

      // 解析前端提交的参数
      const { content, mediaBase64, password } = req.body;

      // 验证发布密码
      if (password !== PUBLISH_PWD) {
        return res.status(401).json({
          success: false,
          error: '发布密码错误'
        });
      }

      // 创建 GitHub Issue（朋友圈动态）
      const issueTitle = `动态_${new Date().toLocaleString('zh-CN')}`;
      const { data: issue } = await octokit.rest.issues.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: issueTitle,
        body: content?.trim() || '（无文字）'
      });

      // 上传媒体文件（如果有）
      if (mediaBase64) {
        await octokit.rest.issues.createComment({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          issue_number: issue.number,
          body: `![media](${mediaBase64})`
        });
      }

      // 发布成功
      return res.status(200).json({
        success: true,
        message: '发布成功！',
        issueNumber: issue.number
      });

    } catch (error) {
      // 捕获所有错误，返回具体信息
      return res.status(500).json({
        success: false,
        error: error.message || '发布失败'
      });
    }
  }

  // ====================== 其他请求方法 ======================
  return res.status(405).json({
    success: false,
    error: '仅支持 GET/POST 请求'
  });
};