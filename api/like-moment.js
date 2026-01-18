// vercel-moments-api/api/like-moment.js
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
    const { issueNumber } = req.body;

    // 2. 校验参数
    if (!issueNumber || !GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
      return res.status(400).json({ success: false, error: '参数缺失' });
    }

    // 3. 初始化 Octokit（低版本写法）
    const octokit = new Octokit({
      auth: GITHUB_TOKEN
    });

    // 4. 点赞（添加 ✨ 反应）- 低版本 API 写法
    try {
      await octokit.reactions.createForIssue({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        number: issueNumber, // 低版本：用 number 而非 issue_number
        content: 'sparkles', // ✨ 表情代表点赞
        mediaType: { previews: ['squirrel-girl'] }
      });
    } catch (error) {
      // 重复点赞会返回 422，特殊处理
      if (error.status === 422) {
        return res.status(200).json({
          success: true,
          message: '你已经点过赞啦！'
        });
      }
      throw error;
    }

    // 5. 返回最新点赞数
    const { data: reactions } = await octokit.reactions.getForIssue({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      number: issueNumber,
      mediaType: { previews: ['squirrel-girl'] }
    });
    const likeCount = reactions.filter(r => r.content === 'sparkles').length;

    res.status(200).json({
      success: true,
      message: '点赞成功！',
      likeCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};