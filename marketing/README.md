# Launch kit

Everything needed to launch slash-editor. None of it has been posted yet.

| Path                                    | What                                                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `research/competitors.md`               | Sourced comparison + safe/avoid claims. Read before writing anything public                                                     |
| `media/`                                | Social preview, OG, demo videos (60s/30s/vertical), GIF, Product Hunt gallery. See `media/README.md`                            |
| `launch/blog-launch-post.md`            | Launch post: dev.to is the primary copy (frontmatter ready, `published: false`); cross-post to Hashnode with canonical → dev.to |
| `launch/show-hn.md`                     | HN title, first comment, prepared answers                                                                                       |
| `launch/x-twitter.md`                   | Launch thread + follow-up posts                                                                                                 |
| `launch/reddit.md`                      | Per-subreddit posts                                                                                                             |
| `launch/product-hunt.md`                | PH fields, description, maker comment, checklist                                                                                |
| `launch/vietnam-community.md`           | Facebook/Threads, Viblo outline, LinkedIn (VI)                                                                                  |
| `launch/directories-and-newsletters.md` | Awesome-list PRs, directories, newsletter pitch                                                                                 |
| `github/setup.sh`                       | Discussions, topics, labels, draft issues (dry run by default, `--apply` to execute)                                            |
| `github/good-first-issues.md`           | Issue drafts consumed by `setup.sh`                                                                                             |
| `github/discussions-welcome.md`         | Pinned welcome post                                                                                                             |
| `../examples/nextjs-starter`            | Starter + Deploy to Vercel button                                                                                               |

## Calendar

Times in ICT (UTC+7). Pre-launch is done: v0.5.1 on npm, starter, README, comparison/migration
docs, labels/issues, Discussions welcome post (#17), GitHub release.

| When (ICT)            | Action                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| **Wed Sep 30, 19:00** | Show HN (`show-hn.md`, title #1, URL = repo) → post first comment immediately → stay until ~23:00  |
| Wed Sep 30, 20:30     | X thread (`x-twitter.md`) with `demo-30s-landscape.mp4`; pin it; share in X Communities            |
| Thu Oct 1             | dev.to post (`blog-launch-post.md`, set `published: true`); r/reactjs (allowed thread), r/tiptap   |
| Fri Oct 2             | r/nextjs; Vietnam: Facebook groups, Threads, LinkedIn (`vietnam-community.md`)                     |
| Sat Oct 3             | r/webdev Showoff Saturday; awesome-list PRs + directory submissions                                |
| Sun Oct 4 – Mon Oct 5 | Newsletter pitches (include HN link if it did well); Viblo post; upload demo to YouTube (unlisted) |
| **Tue Oct 6, 14:01**  | Product Hunt (00:01 PT) — `product-hunt.md`                                                        |
| Every release         | Changelog GIF → X, Discussions; newsletter re-pitch on minors                                      |

## Metrics

Track weekly: GitHub stars and traffic referrers (Insights → Traffic), npm weekly downloads for
both packages, playground visits (Vercel Analytics), and external contributors.
Targets: at 1 month, 500★, 1k downloads per week and 5 external contributors. At 3 months,
1.5k★ and 5k downloads per week.
