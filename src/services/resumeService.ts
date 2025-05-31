
import { supabase } from "@/integrations/supabase/client";
import { extractTextFromFile } from "./resumeTextExtractor";

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  content_type: string | null;
  uploaded_at: string;
  is_active: boolean | null;
  extracted_text: string | null;
}

export const uploadResume = async (file: File): Promise<Resume> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to upload resumes');
  }

  // Extract text from the file
  let extractedText = '';
  try {
    extractedText = await extractTextFromFile(file);
  } catch (error) {
    console.error('Text extraction failed:', error);
    // Continue with upload even if text extraction fails
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;
  
  // Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw uploadError;
  }

  // Save resume metadata to database including extracted text
  const { data, error } = await supabase
    .from('user_resumes')
    .insert({
      user_id: user.id,
      file_name: file.name,
      file_path: uploadData.path,
      file_size: file.size,
      content_type: file.type,
      extracted_text: extractedText || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving resume metadata:', error);
    throw error;
  }

  return data;
};

export const getUserResumes = async (): Promise<Resume[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching resumes:', error);
    throw error;
  }

  return data || [];
};

export const deleteResume = async (resumeId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to delete resumes');
  }

  // Get resume data first
  const { data: resume, error: fetchError } = await supabase
    .from('user_resumes')
    .select('file_path')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    console.error('Error fetching resume:', fetchError);
    throw fetchError;
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('resumes')
    .remove([resume.file_path]);

  if (storageError) {
    console.error('Error deleting file from storage:', storageError);
    throw storageError;
  }

  // Delete from database
  const { error } = await supabase
    .from('user_resumes')
    .delete()
    .eq('id', resumeId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting resume metadata:', error);
    throw error;
  }
};

export const downloadResume = async (filePath: string): Promise<Blob> => {
  const { data, error } = await supabase.storage
    .from('resumes')
    .download(filePath);

  if (error) {
    console.error('Error downloading resume:', error);
    throw error;
  }

  return data;
};
