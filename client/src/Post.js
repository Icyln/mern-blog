import { formatISO9075 } from "date-fns";
import { Link } from "react-router-dom";

export default function Post({ _id, title, summary, cover, content, createdAt, author }) {
  return (
    <div className="post-card">
      {/* Image */}
      <Link to={`/post/${_id}`}>
        <div className="post-image">
          <img src={`http://localhost:4000/${cover}`} alt={title} />
        </div>
      </Link>

      {/* Text Content */}
      <div className="post-content">
        <Link to={`/post/${_id}`}>
          <h2>{title}</h2>
        </Link>
        <p className="post-info">
          <span className="author">@{author.username}</span> |{" "}
          <time>{formatISO9075(new Date(createdAt))}</time>
        </p>
        <p className="post-summary">{summary}</p>
        <Link to={`/post/${_id}`} className="read-more">
          Read more
        </Link>
      </div>
    </div>
  );
}
