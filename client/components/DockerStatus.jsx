const DockerStatus = ({ status }) => {
  if (!status || (status.docker && status.image)) {
    return null;
  }

  return (
    <div className="b3-alert b3-alert--warning" role="alert">
      {!status.docker ? (
        <p>Docker svarar inte. Starta Docker Desktop och ladda om sidan.</p>
      ) : (
        <p>
          Imagen <code>{status.imageName}</code> är inte hämtad än. Kör <code>npm run pull-image</code>{' '}
          (flera GB), annars hämtas den vid första testet.
        </p>
      )}
    </div>
  );
};

export default DockerStatus;
