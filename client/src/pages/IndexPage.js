import { useEffect, useState } from "react";
import Post from "../Post";

export default function IndexPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/post/')
      .then(response => response.json())
      .then(posts => setPosts(posts));
  }, []);

  return (
    <main className="posts-container">
      {posts.length > 0 ? (
        posts.map(post => <Post key={post._id} {...post} />)
      ) : (
        <p>No posts available</p>
      )}
    </main>
  );
}
