// vercel-moments-api/api/post-comment.js
const Octokit = require('@octokit/rest'); // 低版本：直接 require
const cors = require('cors');

const corsHandler = cors({ origin: '*' });

module.exports = async (req, res) => {
  await new Promise((resolve) => corsHandler(req, res, resolve));

  // 仅允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '仅支持 POST 请求' });
  }

  try {
    // 1. 读取环境变量和请求参数
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER;
    const REPO_NAME = process.env.REPO_NAME;
    const { issueNumber, content } = req.body;

    // 2. 校验参数
    if (!issueNumber || !content || !GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
      return res.status(400).json({ success: false, error: '参数缺失' });
    }

    // 3. 初始化 Octokit（低版本写法）
    const octokit = new Octokit({
      auth: GITHUB_TOKEN
    });

    // 4. 发布评论 - 低版本 API 写法
    const { data: comment } = await octokit.issues.createComment({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      number: issueNumber, // 低版本：用 number 而非 issue_number
      body: content.trim()
    });

    // 5. 返回评论信息
    res.status(200).json({
      success: true,
      message: '评论发布成功！',
      comment: {
        author: comment.user.login,
        content: comment.body,
        time: comment.created_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};