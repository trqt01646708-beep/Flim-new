import { Card } from 'antd';
import './MovieCard.css';

const MovieCard = ({ movie }) => {
  return (
    <div className="movie-card">
      <div className="age-badge">{movie.age}</div>
      {movie.isHot && <div className="hot-badge">HOT</div>}
      <img src={movie.poster} alt={movie.title} className="movie-img" />
      <div className="movie-title">{movie.title}</div>
      <div className="movie-description">{movie.description}</div>
    </div>
  );
};

export default MovieCard;
