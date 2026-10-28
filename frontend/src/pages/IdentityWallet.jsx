function IdentityWallet() {
  return (
    <section className="dashboard">
      <h2>Identity Wallet</h2>
      <p>Explore your sample digital credentials.</p>
      <div className="feature-grid">
        <article className="feature-card">
          <h3>Student Credential</h3>
          <p>Example credential · Demo status: Verified</p>
        </article>
        <article className="feature-card">
          <h3>Identity Credential</h3>
          <p>Example credential · Demo status: Pending</p>
        </article>
        <article className="feature-card">
          <h3>Certificate</h3>
          <p>Example credential · Demo status: Verified</p>
        </article>
      </div>
      <p className="demo-note">These are illustrative examples, not real verified credentials.</p>
    </section>
  );
}

export default IdentityWallet;