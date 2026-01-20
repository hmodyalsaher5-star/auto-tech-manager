import { useState } from 'react'
import { supabase } from '../supabase'

function AddProductForm() {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); // حالة تحميل الصورة
  const [imageFile, setImageFile] = useState(null); // الملف المختار

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    year: '',
    price: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // دالة لاختيار الملف من الكمبيوتر
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  // دالة رفع الصورة إلى Supabase Storage
  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`; // اسم عشوائي للصورة
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('car-images') // اسم الخزانة التي أنشأناها
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // الحصول على الرابط العام للصورة
    const { data } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = "https://placehold.co/600x400?text=No+Image"; // صورة افتراضية

      // 1. إذا اختار المستخدم صورة، نقوم برفعها أولاً
      if (imageFile) {
        setUploadingImage(true);
        finalImageUrl = await uploadImage(imageFile);
        setUploadingImage(false);
      }

      // 2. إرسال بيانات المنتج (مع رابط الصورة الجديد) للقاعدة
      const { error } = await supabase
        .from('products')
        .insert([
          {
            name: formData.name,
            brand: formData.brand,
            model: formData.model,
            year: formData.year,
            price: formData.price,
            image_url: finalImageUrl // الرابط القادم من السحابة
          }
        ]);

      if (error) throw error;

      alert("✅ تم إضافة المنتج والصورة بنجاح!");
      window.location.reload();

    } catch (error) {
      alert("❌ حدث خطأ: " + error.message);
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mb-8">
      <h3 className="text-xl font-bold text-white mb-4">🛠️ إضافة منتج جديد (مع رفع صورة 📸)</h3>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <input name="brand" placeholder="الشركة (مثلاً: Toyota)" required
          className="p-2 rounded bg-gray-700 text-white border border-gray-600"
          onChange={handleChange} 
        />
        
        <input name="model" placeholder="الموديل (مثلاً: Camry)" required
          className="p-2 rounded bg-gray-700 text-white border border-gray-600"
          onChange={handleChange} 
        />

        <input name="year" placeholder="السنة (مثلاً: 2018-2023)" required
          className="p-2 rounded bg-gray-700 text-white border border-gray-600"
          onChange={handleChange} 
        />

        <input name="name" placeholder="اسم القطعة" required
          className="p-2 rounded bg-gray-700 text-white border border-gray-600"
          onChange={handleChange} 
        />

        <input name="price" placeholder="السعر" required
          className="p-2 rounded bg-gray-700 text-white border border-gray-600"
          onChange={handleChange} 
        />

        {/* حقل رفع الملف الجديد */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-gray-400 mb-2">صورة المنتج:</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700
              cursor-pointer bg-gray-700 rounded border border-gray-600"
          />
        </div>

        <button type="submit" disabled={loading || uploadingImage}
          className="col-span-1 md:col-span-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition-colors disabled:opacity-50"
        >
          {uploadingImage ? "جارٍ رفع الصورة..." : (loading ? "جارٍ الحفظ..." : "حفظ المنتج")}
        </button>

      </form>
    </div>
  )
}

export default AddProductForm