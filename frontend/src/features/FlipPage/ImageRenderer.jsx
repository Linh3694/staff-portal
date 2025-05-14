function ImageRenderer({ files }) {
  return (
    <>
      {files.map((file, index) => {
        const fileURL = URL.createObjectURL(file);
        return (
          <div key={index} style={{ width: "100%", textAlign: "center", padding: 10 }}>
            <img
              src={fileURL}
              alt={`page-${index + 1}`}
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        );
      })}
    </>
  );
}