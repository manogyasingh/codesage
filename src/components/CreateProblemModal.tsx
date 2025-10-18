import { useState } from 'react';
import { XIcon, PlusIcon, TrashIcon } from './Icons';
import { CreateProblemRequest, StarterCode, problemsService } from '../services/problems';

interface CreateProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: string;
  userId: string;
}

const DIFFICULTY_OPTIONS = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' }
] as const;
const PROGRAMMING_LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust'];
const CATEGORY_OPTIONS = [
  { label: 'Arrays', value: 'arrays' },
  { label: 'Strings', value: 'strings' },
  { label: 'Trees', value: 'trees' },
  { label: 'Graphs', value: 'graphs' },
  { label: 'Dynamic Programming', value: 'dp' },
  { label: 'System Design', value: 'system-design' },
  { label: 'Algorithms', value: 'algorithms' },
  { label: 'Data Structures', value: 'data-structures' }
];

export function CreateProblemModal({ isOpen, onClose, onSuccess, companyId, userId }: CreateProblemModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<CreateProblemRequest>({
    title: '',
    description: '',
    difficulty: 'medium',
    category: 'algorithms',
    tags: [],
    programming_languages: ['Python'],
    time_limit_minutes: 60,
    memory_limit_mb: 256,
    starter_code: [{ language: 'Python', code: '# Write your solution here\ndef solution():\n    pass' }],
    test_cases: '', // Now a string in varchar format
    hints: [],
    is_active: true,
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentHint, setCurrentHint] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const problemData: CreateProblemRequest = {
        id: problemsService.generateProblemId(),
        company_id: companyId,
        created_by: userId,
        ...formData,
      };

      console.log('Creating problem with data:', problemData);
      console.log('Company ID (received):', companyId);
      console.log('User ID (received):', userId);
      console.log('Company ID type:', typeof companyId);
      console.log('User ID type:', typeof userId);

      await problemsService.createProblem(problemData);
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Problem creation error:', err);
      setError(err.message || 'Failed to create problem');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      difficulty: 'medium',
      category: 'algorithms',
      tags: [],
      programming_languages: ['Python'],
      time_limit_minutes: 60,
      memory_limit_mb: 256,
      starter_code: [{ language: 'Python', code: '# Write your solution here\ndef solution():\n    pass' }],
      test_cases: '', // Now a string in varchar format
      hints: [],
      is_active: true,
    });
    setCurrentTag('');
    setCurrentHint('');
    setError('');
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addHint = () => {
    if (currentHint.trim()) {
      setFormData(prev => ({
        ...prev,
        hints: [...(prev.hints || []), currentHint.trim()]
      }));
      setCurrentHint('');
    }
  };

  const removeHint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hints: prev.hints?.filter((_, i) => i !== index) || []
    }));
  };

  const addStarterCode = () => {
    const availableLanguages = PROGRAMMING_LANGUAGES.filter(
      lang => !formData.starter_code.some(sc => sc.language === lang)
    );
    if (availableLanguages.length > 0) {
      setFormData(prev => ({
        ...prev,
        starter_code: [...prev.starter_code, {
          language: availableLanguages[0],
          code: `// Write your ${availableLanguages[0]} solution here`
        }]
      }));
    }
  };

  const removeStarterCode = (index: number) => {
    if (formData.starter_code.length > 1) {
      setFormData(prev => ({
        ...prev,
        starter_code: prev.starter_code.filter((_, i) => i !== index)
      }));
    }
  };

  const updateStarterCode = (index: number, updates: Partial<StarterCode>) => {
    setFormData(prev => ({
      ...prev,
      starter_code: prev.starter_code.map((sc, i) =>
        i === index ? { ...sc, ...updates } : sc
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create New Problem</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Two Sum Problem"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty *
              </label>
              <select
                required
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {DIFFICULTY_OPTIONS.map(difficulty => (
                  <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CATEGORY_OPTIONS.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={formData.time_limit_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the problem, requirements, and constraints..."
            />
          </div>

          {/* Programming Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supported Languages *
            </label>
            <div className="flex flex-wrap gap-2">
              {PROGRAMMING_LANGUAGES.map(lang => (
                <label key={lang} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.programming_languages.includes(lang)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          programming_languages: [...prev.programming_languages, lang]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          programming_languages: prev.programming_languages.filter(l => l !== lang)
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{lang}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map(tag => (
                <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-sm flex items-center">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-blue-600 hover:text-blue-800">
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a tag"
              />
              <button type="button" onClick={addTag} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add
              </button>
            </div>
          </div>

          {/* Test Cases */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Test Cases *
              </label>
            </div>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Input</label>
                    <textarea
                      rows={3}
                      value={formData.test_cases}
                      onChange={(e) => setFormData(prev => ({ ...prev, test_cases: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Input data"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Expected Output</label>
                    <textarea
                      rows={3}
                      value={formData.test_cases}
                      onChange={(e) => setFormData(prev => ({ ...prev, test_cases: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Expected output"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Hidden test case</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Starter Code */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Starter Code Templates
              </label>
              <button 
                type="button" 
                onClick={addStarterCode} 
                className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                disabled={formData.starter_code.length >= PROGRAMMING_LANGUAGES.length}
              >
                <PlusIcon className="w-4 h-4" />
                Add Language
              </button>
            </div>
            <div className="space-y-4">
              {formData.starter_code.map((starterCode, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <select
                      value={starterCode.language}
                      onChange={(e) => updateStarterCode(index, { language: e.target.value })}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PROGRAMMING_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    {formData.starter_code.length > 1 && (
                      <button type="button" onClick={() => removeStarterCode(index)} className="text-red-600 hover:text-red-800">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={6}
                    value={starterCode.code}
                    onChange={(e) => updateStarterCode(index, { code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Starter code template..."
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Hints */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hints (Optional)
            </label>
            <div className="space-y-2 mb-3">
              {(formData.hints || []).map((hint, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                  <span className="text-sm flex-1">{hint}</span>
                  <button type="button" onClick={() => removeHint(index)} className="text-red-600 hover:text-red-800">
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentHint}
                onChange={(e) => setCurrentHint(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHint())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a helpful hint"
              />
              <button type="button" onClick={addHint} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add
              </button>
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Make this problem active immediately</span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
