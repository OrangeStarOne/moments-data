// vercel-moments-api/api/get-likes.js
const Octokit = require('@octokit/rest'); // 低版本核心：引入的是对象，不是构造函数
const cors = require('cors');

const corsHandler = cors({ origin: '*' });

module.exports = async (req, res) => {
  await new Promise((resolve) => corsHandler(req, res, resolve));

  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER;
    const REPO_NAME = process.env.REPO_NAME;
    const { issueNumber } = req.query;

    if (!issueNumber || !GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
      return res.status(400).json({ success: false, error: '参数缺失' });
    }

    // 🔥 关键修正：低版本必须用 new Octokit.Octokit()
    const octokit = new Octokit.Octokit({
      auth: GITHUB_TOKEN
    });

    // 低版本 API：getForIssue + number 参数
    const { data: reactions } = await octokit.reactions.getForIssue({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      number: issueNumber,
      mediaType: { previews: ['squirrel-girl'] }
    });

    const likeCount = reactions.filter(r => r.content === 'sparkles').length;

    res.status(200).json({
      success: true,
      likeCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || '获取点赞数失败'
    });
  }
};
