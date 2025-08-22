"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Icons } from "@/components/ui/icons"
import { CalendarDays, Edit, Eye, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface BlogPost {
  id: string
  title: string
  content: string
  published: boolean
  createdAt: string
  updatedAt: string
  author: {
    name: string
    email: string
    image?: string
  }
}

export default function BlogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchPosts()
    }
  }, [session])

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/blog/posts")
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      toast.error("Failed to fetch posts")
    } finally {
      setIsLoading(false)
    }
  }

  const deletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        toast.success("Post deleted successfully")
        fetchPosts()
      } else {
        toast.error("Failed to delete post")
      }
    } catch (error) {
      toast.error("Failed to delete post")
    }
  }

  const togglePublish = async (postId: string, published: boolean) => {
    try {
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ published: !published }),
      })
      
      if (response.ok) {
        toast.success(`Post ${published ? 'unpublished' : 'published'} successfully`)
        fetchPosts()
      } else {
        toast.error("Failed to update post")
      }
    } catch (error) {
      toast.error("Failed to update post")
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Blog Posts</h1>
            <p className="text-muted-foreground">Manage your blog posts and articles</p>
          </div>
          <Link href="/blog/new">
            <Button>
              <Icons.user className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icons.spinner className="h-6 w-6 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Icons.user className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                Start writing your first blog post
              </p>
              <Link href="/blog/new">
                <Button>Create Your First Post</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={post.published ? "default" : "secondary"}>
                          {post.published ? "Published" : "Draft"}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarDays className="h-3 w-3 mr-1" />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <CardTitle className="text-xl">{post.title}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublish(post.id, post.published)}
                      >
                        {post.published ? "Unpublish" : "Publish"}
                      </Button>
                      <Link href={`/blog/edit/${post.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.author.image || ""} alt={post.author.name} />
                        <AvatarFallback>
                          {post.author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {post.author.name}
                      </span>
                    </div>
                    {post.published && (
                      <Link href={`/blog/post/${post.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}