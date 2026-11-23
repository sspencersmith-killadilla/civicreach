DROP POLICY IF EXISTS "public upload active city wellness photos" ON storage.objects;
CREATE POLICY "public upload active city wellness photos" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'wellness-photos'
  AND array_length(storage.foldername(objects.name), 1) = 2
  AND (storage.foldername(objects.name))[2] ~ '^W-?[A-Z0-9]{4,10}$'
  AND lower(storage.extension(objects.name)) IN ('jpg','jpeg','png','webp','heic','heif','gif')
  AND EXISTS (SELECT 1 FROM public.cities c WHERE c.id::text = (storage.foldername(objects.name))[1] AND c.status = 'active')
);