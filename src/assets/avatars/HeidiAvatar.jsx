import heidiImage from "./heidi-oficial.jpg";

export default function HeidiAvatar({ className = "" }) {
  return (
    <div
      className={`sirius-official-avatar sirius-official-avatar-heidi ${className}`}
      role="img"
      aria-label="Heidi"
    >
      <img
        src={heidiImage}
        alt="Heidi"
        draggable="false"
      />
    </div>
  );
}
