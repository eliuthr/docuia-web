import { RUNTIME_CONFIG_URL, resolveApiBaseUrl } from './resolve-api-base-url';

const RUNTIME = { production: true, apiBaseUrl: null };

function fetchReturning(body: unknown, status = 200) {
  return vi.fn<typeof fetch>().mockResolvedValue(Response.json(body, { status }));
}

describe('resolveApiBaseUrl', () => {
  it('uses the environment URL without loading config.json', async () => {
    const fetchConfig = fetchReturning({});

    const url = await resolveApiBaseUrl(
      { production: false, apiBaseUrl: 'http://localhost:3000' },
      fetchConfig,
    );

    expect(url).toBe('http://localhost:3000');
    expect(fetchConfig).not.toHaveBeenCalled();
  });

  it('reads the URL from config.json and drops the trailing slash', async () => {
    const fetchConfig = fetchReturning({ apiBaseUrl: 'https://abc.lambda-url.aws/' });

    const url = await resolveApiBaseUrl(RUNTIME, fetchConfig);

    expect(url).toBe('https://abc.lambda-url.aws');
    expect(fetchConfig).toHaveBeenCalledWith(RUNTIME_CONFIG_URL, { cache: 'no-store' });
  });

  it('fails when config.json cannot be loaded', async () => {
    await expect(resolveApiBaseUrl(RUNTIME, fetchReturning({}, 404))).rejects.toThrow('404');
  });

  it('fails when config.json has no apiBaseUrl', async () => {
    await expect(resolveApiBaseUrl(RUNTIME, fetchReturning({ other: 1 }))).rejects.toThrow(
      'no apiBaseUrl',
    );
  });
});
