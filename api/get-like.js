// vercel-moments-api/api/get-likes.js
const Octokit = require('@octokit/rest'); // 低版本：直接 require，不是解构
const cors = require('cors');

// 跨域配置
const corsHandler = cors({ origin: '*' });

module.exports = async (req, res) => {
  await new Promise((resolve) => corsHandler(req, res, resolve));

  try {
    // 1. 读取环境变量
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER;
    const REPO_NAME = process.env.REPO_NAME;
    const { issueNumber } = req.query;

    // 2. 校验参数
    if (!issueNumber || !GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
      return res.status(400).json({ success: false, error: '参数缺失' });
    }

    // 3. 初始化 Octokit（低版本写法）
    const octokit = new Octokit({
      auth: GITHUB_TOKEN
    });

    // 4. 获取点赞数（Reactions）- 低版本 API 写法
    const { data: reactions } = await octokit.reactions.getForIssue({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      number: issueNumber, // 低版本：用 number 而非 issue_number
      mediaType: { previews: ['squirrel-girl'] } // 必须加这个预览头
    });

    // 统计 ✨ 表情的点赞数
    const likeCount = reactions.filter(r => r.content === 'sparkles').length;

    res.status(200).json({
      success: true,
      likeCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};