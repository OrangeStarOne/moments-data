// vercel-moments-api/api/publish.js
// 引入正确的 Octokit v2 版本
const { Octokit } = require('@octokit/rest');
const cors = require('cors');

// 1. 解决跨域（允许所有域名，测试用）
const corsHandler = cors({ origin: '*' });

// 2. 主函数（Vercel 入口）
module.exports = async (req, res) => {
  // 处理跨域
  await new Promise((resolve) => corsHandler(req, res, resolve));

  try {
    // 3. 读取 Vercel 环境变量
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER;
    const REPO_NAME = process.env.REPO_NAME;
    const PUBLISH_PWD = process.env.PUBLISH_PWD;

    // ====================== GET 请求：验证接口可用性 ======================
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: '接口已正常访问！',
        tip: '请用 POST 请求发布动态'
      });
    }

    // ====================== POST 请求：发布朋友圈 ======================
    if (req.method === 'POST') {
      // 验证环境变量是否完整
      if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME || !PUBLISH_PWD) {
        return res.status(500).json({
          success: false,
          error: 'Vercel 环境变量未配置完整'
        });
      }

      // 初始化 Octokit（正确的 v2 版本语法）
      const octokit = new Octokit({
        auth: GITHUB_TOKEN
      });

      // 解析前端参数
      const { content, mediaBase64, password } = req.body;

      // 验证发布密码
      if (password !== PUBLISH_PWD) {
        return res.status(401).json({
          success: false,
          error: '发布密码错误'
        });
      }

      // 1. 创建 GitHub Issue（核心：v2 版本正确的 API 调用方式）
      const issueResponse = await octokit.issues.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: `动态_${new Date().toLocaleString('zh-CN')}`,
        body: content?.trim() || '（无文字）'
      });
      const issueNumber = issueResponse.data.number;

      // 2. 上传媒体文件到 Issue 评论（如果有）
      if (mediaBase64) {
        await octokit.issues.createComment({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          issue_number: issueNumber,
          body: `![media](${mediaBase64})`
        });
      }

      // 发布成功
      return res.status(200).json({
        success: true,
        message: '发布成功！',
        issueNumber: issueNumber
      });
    }

    // ====================== 不支持的请求方法 ======================
    return res.status(405).json({
      success: false,
      error: '仅支持 GET/POST 请求'
    });

  } catch (error) {
    // 捕获所有错误并返回
    console.error('执行错误：', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || '服务器内部错误'
    });
  }
};