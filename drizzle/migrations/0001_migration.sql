create policy "staff read client docs" on storage.objects for select to authenticated using (bucket_id = 'client-documents' and public.is_staff(auth.uid()));
create policy "staff upload client docs" on storage.objects for insert to authenticated with check (bucket_id = 'client-documents' and public.is_staff(auth.uid()));
create policy "staff delete client docs" on storage.objects for delete to authenticated using (bucket_id = 'client-documents' and public.is_staff(auth.uid()));
create policy "public upload wellness photos" on storage.objects for insert to anon, authenticated with check (bucket_id = 'wellness-photos');
create policy "staff read wellness photos" on storage.objects for select to authenticated using (bucket_id = 'wellness-photos' and public.is_staff(auth.uid()));
