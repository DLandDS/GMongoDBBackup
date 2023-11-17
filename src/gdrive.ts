import fs from 'fs';
import { google } from 'googleapis';

const keyString = fs.readFileSync('./keys.json', 'utf8');
const keys: {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
    universe_domain: string;
} = JSON.parse(keyString);


const clientAuth = new google.auth.JWT({
    email: keys.client_email,
    key: keys.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({
    version: 'v3',
    auth: clientAuth,
});

export default drive;
