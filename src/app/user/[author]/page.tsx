import Link from "next/link";
import { searchPosts } from "@/lib/search";

interface UserPageProps {
  params: { author: string };
}

interface UserPost {
  pid: number;
  tid: number;
  fid: number;
  content: string;
  createTime: number;
  floor: number;
}

export default function UserPage({ params }: UserPageProps) {
  const author = decodeURIComponent(params.author);
  const results = searchPosts(`author:${author}`, undefined, 30, 0);
  const posts: UserPost[] = results.map((r) => ({
    pid: r.pid,
    tid: r.tid,
    fid: r.fid ?? 0,
    content: r.content,
    createTime: r.createTime,
    floor: r.floor,
  }));

  const initials = author.slice(0, 2).toUpperCase();
  const AVATAR_GRADIENTS = [
    "from-indigo-400 to-blue-500",
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500",
    "from-purple-400 to-pink-500",
  ];
  const gradIdx = Math.abs(author.split("").reduce((h: number, c: string) => h + c.charCodeAt(0), 0)) % 4;

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm no-underline">
          ← 返回
        </Link>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">用户</h1>
      </div>

      <div className="flex items-center gap-4 mb-6 glass-card rounded-2xl px-5 py-4">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} flex items-center justify-center text-lg font-bold text-white shadow-sm shrink-0`}>
          {initials}
        </div>
        <div>
          <h2 className="text-title text-[var(--text-primary)]">{author}</h2>
          <p className="text-body-sm text-[var(--text-tertiary)]">
            {posts.length > 0 ? `${posts.length} 条发言` : "暂无发言记录"}
          </p>
        </div>
      </div>

      {posts.length === 0 && (
        <div className="glass-card rounded-3xl text-center py-16">
          <div className="text-4xl mb-3 opacity-20">@</div>
          <p className="text-[var(--text-secondary)] text-sm">该用户暂无发言记录</p>
          <p className="text-[var(--text-tertiary)] text-xs mt-2">当前缓存中未收录此用户的帖子</p>
        </div>
      )}

      <div className="space-y-1.5">
        {posts.map((p, i) => (
          <Link key={`${p.pid}-${i}`} href={`/forum/${p.fid}/thread/${p.tid}`}
            className="block glass-card rounded-2xl px-4 py-3 no-underline hover:shadow-elevated transition-all group">
            <div className="flex items-center gap-3 text-label text-[var(--text-tertiary)] mb-1">
              <span>#{p.floor}</span>
              <span>{new Date(p.createTime).toLocaleDateString("zh-CN")}</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">{p.content}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
