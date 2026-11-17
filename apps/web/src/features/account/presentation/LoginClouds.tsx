export function LoginClouds() {
  return (
    <div className="login-clouds" aria-hidden="true">
      {[1, 2, 3, 4].map((number) => (
        <img
          key={number}
          className={`login-cloud login-cloud-${number}`}
          src={`/images/login/cloud-${number}.svg`}
          alt=""
          width="260"
          height="140"
        />
      ))}
    </div>
  );
}
