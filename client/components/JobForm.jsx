import { useState } from 'react';
import { createJob } from '../api.js';

const JobForm = ({ catalog, onCreated }) => {
  const [url, setUrl] = useState('');
  const [tests, setTests] = useState(catalog.defaultTests);
  const [language, setLanguage] = useState('sv');
  const [mobile, setMobile] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleTest = (id) => {
    setTests((current) => (current.includes(id) ? current.filter((testId) => testId !== id) : [...current, id]));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const job = await createJob({ url, tests, language, mobile });
      onCreated(job);
      setUrl('');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="b3-job-form" onSubmit={handleSubmit} noValidate>
      <h2 className="b3-job-form__title">Nytt test</h2>

      <label className="b3-job-form__label" htmlFor="b3-url">Adress</label>
      <input
        id="b3-url"
        className="b3-job-form__input"
        type="url"
        placeholder="https://www.exempel.se"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        aria-describedby={error ? 'b3-form-error' : undefined}
        aria-invalid={Boolean(error)}
        required
      />

      <fieldset className="b3-job-form__fieldset">
        <legend className="b3-job-form__legend">Tester</legend>
        <div className="b3-job-form__quick">
          <button type="button" className="b3-button b3-button--link" onClick={() => setTests(catalog.tests.map((test) => test.id))}>
            Välj alla
          </button>
          <button type="button" className="b3-button b3-button--link" onClick={() => setTests([])}>
            Rensa
          </button>
        </div>
        {catalog.tests.map((test) => (
          <label key={test.id} className="b3-job-form__check">
            <input type="checkbox" checked={tests.includes(test.id)} onChange={() => toggleTest(test.id)} />
            <span>
              <span className="b3-job-form__check-name">{test.name}</span>
              <span className="b3-job-form__check-description">{test.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="b3-job-form__row">
        <label className="b3-job-form__label" htmlFor="b3-language">Språk i rapporten</label>
        <select id="b3-language" className="b3-job-form__input" value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="sv">Svenska</option>
          <option value="en">Engelska</option>
        </select>
      </div>

      <label className="b3-job-form__check">
        <input type="checkbox" checked={mobile} onChange={(event) => setMobile(event.target.checked)} />
        <span>Mät som mobil (Sitespeed)</span>
      </label>

      {error && (
        <p id="b3-form-error" className="b3-job-form__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="b3-button b3-button--primary" disabled={submitting || tests.length === 0}>
        {submitting ? 'Startar…' : `Kör ${tests.length} test`}
      </button>
    </form>
  );
};

export default JobForm;
