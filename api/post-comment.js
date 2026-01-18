// vercel-moments-api/api/post-comment.js
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
    const { issueNumber, content } = req.body;

    if (!issueNumber || !content || !GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
      return res.status(400).json({ success: false, error: '参数缺失' });
    }

    // 🔥 关键修正：new Octokit.Octokit()
    const octokit = new Octokit.Octokit({
      auth: GITHUB_TOKEN
    });

    const { data: comment } = await octokit.issues.createComment({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      number: issueNumber,
      body: content.trim()
    });

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
      error: error.message || '评论失败'
    });
  }
};
