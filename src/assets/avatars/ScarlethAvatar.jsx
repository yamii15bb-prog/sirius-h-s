import scarlethImage from "./scarleth-oficial.jpg";

export default function ScarlethAvatar({ className = "" }) {
  return (
    <div
      className={`sirius-official-avatar sirius-official-avatar-scarleth ${className}`}
      role="img"
      aria-label="Scarleth"
    >
      <img
        src={scarlethImage}
        alt="Scarleth"
        draggable="false"
      />
    </div>
  );
}
