function AuditHistory() {
  return (
    <section className="dashboard">
      <h2>Activity History</h2>
      <p>Illustrative activity records for the PrivyChain prototype.</p>
      <article className="feature-card">
        <h3>Credential viewed</h3>
        <p>Sample event · Demonstration record</p>
      </article>
      <article className="feature-card">
        <h3>Access request received</h3>
        <p>Sample event · Demonstration record</p>
      </article>
      <p className="demo-note">
        No real blockchain events or transaction hashes are displayed.
      </p>
    </section>
  );
}

export default AuditHistory;