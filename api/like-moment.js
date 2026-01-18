// vercel-moments-api/api/like-moment.js
const Octokit = require('@octokit/rest');
const cors = require('cors');

const corsHandler = cors({ origin: '*' });

module.exports = async (req, res) => {
  await new Promise((resolve) => corsHandler(req, res, resolve));

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '仅支持 POST 请求' });
  }

  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER;
    const REPO_NAME = process.env.REPO_NAME;
    const { issueNumber } = req.body;

    if (!issueNumber || !GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
      return res.status(400).json({ success: false, error: '参数缺失' });
    }

    // 🔥 关键修正：new Octokit.Octokit()
    const octokit = new Octokit.Octokit({
      auth: GITHUB_TOKEN
    });

    try {
      await octokit.reactions.createForIssue({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        number: issueNumber,
        content: 'sparkles',
        mediaType: { previews: ['squirrel-girl'] }
      });
    } catch (error) {
      if (error.status === 422) {
        return res.status(200).json({
          success: true,
          message: '你已经点过赞啦！'
        });
      }
      throw error;
    }

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
      error: error.message || '点赞失败'
    });
  }
};
