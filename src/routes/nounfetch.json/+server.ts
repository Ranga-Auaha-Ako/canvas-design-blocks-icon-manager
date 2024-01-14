import { json as json$1 } from '@sveltejs/kit';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import axios from 'axios';
import type { RequestEvent } from '@sveltejs/kit';

export const prerender = false;

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
 // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
 export async function POST({request}: RequestEvent) {
    const body = await request.json();
    if(!body || !(body?.key && body?.secret)) return;
	const oauth = new OAuth({
		consumer: { key: body.key, secret: body.secret },
		signature_method: 'HMAC-SHA1',
		hash_function(base_string, key) {
			return crypto.createHmac('sha1', key).update(base_string).digest('base64');
		}
	});
	const request_data = {
        url: `https://api.thenounproject.com/icon/${body.id}`,
        method: 'get',
    };
    try {
      const response = await axios.get(request_data.url,{
          headers: { ...oauth.toHeader(oauth.authorize(request_data)) }
        })
      return json$1(response.data);
    } catch (error) {
      return json$1({error: "The Noun Project returned an error."}, {
          status: 500
      })
    }
}
