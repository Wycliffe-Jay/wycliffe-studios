import { createClient, type User } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://shzyzqwjyyutvldyzuee.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bspdymEMrxAzgwjNeyxcQw_BIOHgazK';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export const ADMIN_UID = 'ecbb9203-f2aa-4c73-b471-dee154ea56ac';

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw error;
  if (!data.user || data.user.id !== ADMIN_UID) {
    await supabase.auth.signOut();
    throw new Error('This account is not authorized to manage Wycliffe Studios.');
  }

  return data.user;
}

export const signOutAdmin = () => supabase.auth.signOut();

export function watchAuth(callback: (user: User | null) => void) {
  let active = true;

  // Resolve the existing session explicitly so the admin page does not
  // depend on the auth event arriving before the initial render.
  void supabase.auth.getSession().then(({ data }) => {
    if (active) callback(data.session?.user ?? null);
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (active) callback(session?.user ?? null);
  });

  return () => {
    active = false;
    data.subscription.unsubscribe();
  };
}

export async function readSection(id: string): Promise<Record<string, any> | null> {
  const { data, error } = await supabase
    .from('site_content')
    .select('data')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data?.data ?? null;
}

export async function saveSection(id: string, data: Record<string, any>) {
  const { error } = await supabase
    .from('site_content')
    .upsert({ id, data, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  if (error) throw error;
}

function mapRowToUi(name: string, row: Record<string, any>) {
  switch (name) {
    case 'pricing':
      return {
        ...row,
        packageName: row.package_name ?? row.packageName,
      };
    case 'testimonials':
      return {
        ...row,
        clientName: row.client_name ?? row.clientName,
        businessName: row.business_name ?? row.businessName,
      };
    case 'projects':
      return {
        ...row,
        imageUrl: row.image_url ?? row.imageUrl,
      };
    case 'client_inquiries':
      return {
        ...row,
        projectDetails: row.project_details ?? row.projectDetails,
        createdAt: row.created_at ?? row.createdAt,
      };
    default:
      return row;
  }
}

function mapUiToDb(name: string, data: Record<string, any>) {
  switch (name) {
    case 'pricing':
      return {
        package_name: data.packageName ?? data.package_name ?? '',
        price: data.price ?? '',
        description: data.description ?? '',
        order: Number(data.order ?? 0),
      };
    case 'testimonials':
      return {
        client_name: data.clientName ?? data.client_name ?? '',
        business_name: data.businessName ?? data.business_name ?? '',
        text: data.text ?? '',
        order: Number(data.order ?? 0),
      };
    case 'projects':
      return {
        title: data.title ?? '',
        category: data.category ?? data.type ?? '',
        tag: data.tag ?? '',
        description: data.description ?? '',
        image_url: data.imageUrl ?? data.image_url ?? '',
        order: Number(data.order ?? 0),
      };
    case 'client_inquiries':
      return {
        name: data.name ?? '',
        business: data.business ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        service: data.service ?? '',
        budget: data.budget ?? '',
        project_details: data.projectDetails ?? data.project_details ?? '',
        status: data.status ?? 'New',
      };
    default:
      return data;
  }
}

export async function readCollection(name: string): Promise<Record<string, any>[]> {
  let result = await supabase.from(name).select('*').order('order', { ascending: true });

  if (result.error) {
    result = await supabase.from(name).select('*');
  }

  if (result.error) throw result.error;

  return (result.data ?? []).map(row => mapRowToUi(name, row));
}

export async function saveCollectionItem(name: string, id: string | undefined, data: Record<string, any>) {
  const mapped = mapUiToDb(name, data);

  if (id) {
    const { error } = await supabase.from(name).update(mapped).eq('id', id);
    if (error) throw error;
    return id;
  }

  const { data: created, error } = await supabase
    .from(name)
    .insert(mapped)
    .select('id')
    .single();

  if (error) throw error;
  return created.id;
}

export async function deleteCollectionItem(name: string, id: string) {
  const { error } = await supabase.from(name).delete().eq('id', id);
  if (error) throw error;
}

export async function createClientInquiry(data: {
  name: string;
  business: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  projectDetails: string;
}) {
  const { error } = await supabase.from('client_inquiries').insert({
    name: data.name,
    business: data.business,
    email: data.email,
    phone: data.phone,
    service: data.service,
    budget: data.budget,
    project_details: data.projectDetails,
    status: 'New',
  });

  if (error) throw error;
}

export async function updateInquiryStatus(id: string, status: string) {
  const { error } = await supabase
    .from('client_inquiries')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

const CLOUDINARY_CLOUD_NAME = 'sqzpc1s7';
const CLOUDINARY_UPLOAD_PRESET = 'wycliffe_portfolio';
const CLOUDINARY_UPLOAD_URL =
  'https://api.cloudinary.com/v1_1/' + CLOUDINARY_CLOUD_NAME + '/image/upload';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export function uploadImage(
  file: File,
  _folder = 'portfolio',
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return Promise.reject(new Error('Please select a PNG, JPG, JPEG, WEBP, or GIF image.'));
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return Promise.reject(new Error('Image must be 10 MB or smaller.'));
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', CLOUDINARY_UPLOAD_URL);
    xhr.responseType = 'json';

    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      const response = xhr.response as { secure_url?: string; error?: { message?: string } } | null;

      if (xhr.status >= 200 && xhr.status < 300 && response?.secure_url) {
        onProgress?.(100);
        resolve(response.secure_url);
        return;
      }

      reject(new Error(response?.error?.message || 'Cloudinary image upload failed.'));
    });

    xhr.addEventListener('error', () => reject(new Error('Could not connect to Cloudinary.')));
    xhr.addEventListener('abort', () => reject(new Error('Image upload was cancelled.')));

    xhr.send(formData);
  });
}
