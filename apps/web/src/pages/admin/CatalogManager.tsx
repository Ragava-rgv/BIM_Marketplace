import { useEffect, useRef, useState } from 'react';
import type { CategoryGroupDto, CategoryDto, CategorySpecTemplateDto, SubcategoryDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import {
  Button,
  Card,
  ErrorBanner,
  Field,
  Input,
  PageHeading,
  Select,
  SuccessBanner,
  Textarea,
} from '../../components/ui';
import { PlusIcon, TrashIcon, ChevronRightIcon, UploadIcon } from '../../components/icons';

const FIELD_TYPES = ['number', 'text', 'select', 'boolean'] as const;
const FILTER_TYPES = ['none', 'range', 'exact'] as const;

type SpecFieldType = (typeof FIELD_TYPES)[number];
type SpecFilterType = (typeof FILTER_TYPES)[number];

interface NewSpecFieldValues {
  fieldKey: string;
  fieldLabel: string;
  unit: string;
  fieldType: SpecFieldType;
  options: string;
  isRequired: boolean;
  isFilterable: boolean;
  filterType: SpecFilterType;
  helpText: string;
}

const EMPTY_FIELD: NewSpecFieldValues = {
  fieldKey: '', fieldLabel: '', unit: '', fieldType: 'text',
  options: '', isRequired: false, isFilterable: false, filterType: 'none', helpText: '',
};

interface NewCategoryValues {
  name: string; slug: string; description: string; groupId: string; iconKey: string;
}

const EMPTY_CAT: NewCategoryValues = { name: '', slug: '', description: '', groupId: '', iconKey: '' };

interface NewSubcategoryValues {
  name: string; slug: string; description: string; iconKey: string;
}

const EMPTY_SUB: NewSubcategoryValues = { name: '', slug: '', description: '', iconKey: '' };

type AdminCategory = CategoryDto & {
  group?: CategoryGroupDto | null;
  specFields?: CategorySpecTemplateDto[];
  subcategories?: SubcategoryDto[];
  _count?: { listings: number };
};

export function AdminCatalogManager() {
  const [groups, setGroups] = useState<CategoryGroupDto[]>([]);
  const [allCats, setAllCats] = useState<AdminCategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);

  const [showCatForm, setShowCatForm] = useState(false);
  const [newCat, setNewCat] = useState<NewCategoryValues>(EMPTY_CAT);
  const [addingCat, setAddingCat] = useState(false);

  const [showFieldForm, setShowFieldForm] = useState(false);
  const [newField, setNewField] = useState<NewSpecFieldValues>(EMPTY_FIELD);
  const [addingField, setAddingField] = useState(false);

  const [showSubForm, setShowSubForm] = useState(false);
  const [newSub, setNewSub] = useState<NewSubcategoryValues>(EMPTY_SUB);
  const [addingSub, setAddingSub] = useState(false);

  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
  const [deletingFieldId, setDeletingFieldId] = useState<string | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  const [uploadingCatImage, setUploadingCatImage] = useState(false);
  const [uploadingSubImageId, setUploadingSubImageId] = useState<string | null>(null);

  const catImageRef = useRef<HTMLInputElement>(null);
  const subImageRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    const [groupsRes, catsRes] = await Promise.all([
      api.get<CategoryGroupDto[]>('/admin/catalog/groups'),
      api.get<AdminCategory[]>('/admin/catalog/categories'),
    ]);
    setGroups(groupsRes.data);
    setAllCats(catsRes.data);
  };

  useEffect(() => {
    load().catch(() => setError('Could not load catalog data')).finally(() => setLoading(false));
  }, []);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  // â"€â"€ Group actions â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setAddingGroup(true);
    setError(null);
    try {
      await api.post('/admin/catalog/groups', { name: newGroupName.trim() });
      setNewGroupName('');
      await load();
      flash('Group created');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create group'));
    } finally { setAddingGroup(false); }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`Delete group "${name}"? This fails if it still has categories.`)) return;
    setError(null);
    try {
      await api.delete(`/admin/catalog/groups/${id}`);
      await load();
      flash('Group deleted');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete group'));
    }
  };

  // â"€â"€ Category actions â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCat(true);
    setError(null);
    try {
      await api.post('/admin/catalog/categories', {
        name: newCat.name.trim(),
        slug: newCat.slug.trim(),
        description: newCat.description.trim() || undefined,
        groupId: newCat.groupId || undefined,
        iconKey: newCat.iconKey.trim() || undefined,
      });
      setNewCat(EMPTY_CAT);
      setShowCatForm(false);
      await load();
      flash('Category created');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create category'));
    } finally { setAddingCat(false); }
  };

  const handleToggleCatActive = async (cat: AdminCategory) => {
    setError(null);
    try {
      if (cat.isActive) {
        await api.patch(`/admin/catalog/categories/${cat.id}/deactivate`);
      } else {
        await api.patch(`/admin/catalog/categories/${cat.id}`, { isActive: true });
      }
      await load();
      flash(`${cat.name} ${cat.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update category'));
    }
  };

  const handleDeleteCategory = async (cat: AdminCategory) => {
    const listingCount = cat._count?.listings ?? 0;
    if (listingCount > 0) {
      alert(`Cannot delete: ${listingCount} listing(s) reference this category. Deactivate it instead.`);
      return;
    }
    const subCount = cat.subcategories?.length ?? 0;
    const msg = subCount > 0
      ? `Permanently delete "${cat.name}" and its ${subCount} subcategory/ies? This cannot be undone.`
      : `Permanently delete "${cat.name}"? This cannot be undone.`;
    if (!confirm(msg)) return;
    setDeletingCatId(cat.id);
    setError(null);
    try {
      await api.delete(`/admin/catalog/categories/${cat.id}`);
      if (selectedCatId === cat.id) setSelectedCatId(null);
      await load();
      flash('Category deleted');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete category'));
    } finally { setDeletingCatId(null); }
  };

  const handleUploadCategoryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCatId || !e.target.files?.[0]) return;
    setUploadingCatImage(true);
    setError(null);
    const fd = new FormData();
    fd.append('image', e.target.files[0]);
    try {
      await api.post(`/admin/catalog/categories/${selectedCatId}/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
      flash('Category image updated');
    } catch (err) {
      setError(apiErrorMessage(err, 'Image upload failed'));
    } finally { setUploadingCatImage(false); }
  };

  // â"€â"€ Subcategory actions â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) return;
    setAddingSub(true);
    setError(null);
    try {
      await api.post('/admin/catalog/subcategories', {
        categoryId: selectedCatId,
        name: newSub.name.trim(),
        slug: newSub.slug.trim(),
        description: newSub.description.trim() || undefined,
        iconKey: newSub.iconKey.trim() || undefined,
      });
      setNewSub(EMPTY_SUB);
      setShowSubForm(false);
      await load();
      flash('Subcategory added');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add subcategory'));
    } finally { setAddingSub(false); }
  };

  const handleToggleSubActive = async (sub: SubcategoryDto) => {
    setError(null);
    try {
      if (sub.isActive) {
        await api.patch(`/admin/catalog/subcategories/${sub.id}/deactivate`);
      } else {
        await api.patch(`/admin/catalog/subcategories/${sub.id}`, { isActive: true });
      }
      await load();
      flash(`${sub.name} ${sub.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update subcategory'));
    }
  };

  const handleDeleteSubcategory = async (sub: SubcategoryDto) => {
    if (!confirm(`Permanently delete subcategory "${sub.name}"?`)) return;
    setDeletingSubId(sub.id);
    setError(null);
    try {
      await api.delete(`/admin/catalog/subcategories/${sub.id}`);
      await load();
      flash('Subcategory deleted');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete subcategory'));
    } finally { setDeletingSubId(null); }
  };

  const handleUploadSubImage = async (sub: SubcategoryDto, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingSubImageId(sub.id);
    setError(null);
    const fd = new FormData();
    fd.append('image', e.target.files[0]);
    try {
      await api.post(`/admin/catalog/subcategories/${sub.id}/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
      flash(`Image updated for ${sub.name}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Image upload failed'));
    } finally { setUploadingSubImageId(null); }
  };

  // â"€â"€ Spec field actions â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  const handleAddSpecField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) return;
    setAddingField(true);
    setError(null);
    try {
      await api.post(`/admin/catalog/categories/${selectedCatId}/spec-fields`, {
        fieldKey: newField.fieldKey.trim(),
        fieldLabel: newField.fieldLabel.trim(),
        unit: newField.unit.trim() || undefined,
        fieldType: newField.fieldType,
        options: newField.fieldType === 'select'
          ? newField.options.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        isRequired: newField.isRequired,
        isFilterable: newField.isFilterable,
        filterType: newField.filterType,
        helpText: newField.helpText.trim() || undefined,
      });
      setNewField(EMPTY_FIELD);
      setShowFieldForm(false);
      await load();
      flash('Spec field added');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add spec field'));
    } finally { setAddingField(false); }
  };

  const handleDeleteSpecField = async (fieldId: string, label: string) => {
    if (!confirm(`Remove field "${label}"? Existing listing specs keep their data but the field won't appear in forms.`)) return;
    setDeletingFieldId(fieldId);
    setError(null);
    try {
      await api.delete(`/admin/catalog/spec-fields/${fieldId}`);
      await load();
      flash('Spec field removed');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete spec field'));
    } finally { setDeletingFieldId(null); }
  };

  // â"€â"€ Render â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  const selectedCat = allCats.find((c) => c.id === selectedCatId) ?? null;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-navy/5" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow="Admin · catalog"
        title="Machine Catalog Manager"
        description="Add machine types, subcategories and spec fields. Everything here is data — no code changes needed to add a new machine type."
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {success && <div className="mb-5"><SuccessBanner message={success} /></div>}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">

        {/* â"€â"€ Left panel â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
        <div className="space-y-5">
          {/* Groups */}
          <Card>
            <h2 className="mb-3 text-sm font-bold text-ink">Category groups</h2>
            <form onSubmit={(e) => void handleAddGroup(e)} className="flex gap-2">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="New group name"
                className="flex-1"
              />
              <Button type="submit" disabled={addingGroup || !newGroupName.trim()}>
                <PlusIcon className="h-4 w-4" />
              </Button>
            </form>
            <ul className="mt-3 space-y-1.5">
              {groups.map((g) => (
                <li key={g.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                  <span className="font-medium text-ink">{g.name}</span>
                  <button
                    onClick={() => void handleDeleteGroup(g.id, g.name)}
                    className="text-red-500 hover:text-red-700 transition"
                    title="Delete group"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Category list */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">
                Categories <span className="font-mono text-[11px] text-muted">({allCats.length})</span>
              </h2>
              <Button variant="ghost" onClick={() => setShowCatForm((v) => !v)} className="!px-2.5 !py-1 text-xs">
                {showCatForm ? 'Cancel' : '+ New'}
              </Button>
            </div>

            {showCatForm && (
              <form onSubmit={(e) => void handleAddCategory(e)} className="mb-4 space-y-3 rounded-lg border border-line bg-navy/[.02] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted">New category</h3>
                <Field label="Name">
                  <Input
                    value={newCat.name}
                    onChange={(e) => setNewCat((v) => ({
                      ...v,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                    }))}
                    placeholder="Press Brake"
                    required
                  />
                </Field>
                <Field label="Slug" hint="Auto-filled — edit if needed">
                  <Input value={newCat.slug} onChange={(e) => setNewCat((v) => ({ ...v, slug: e.target.value }))} placeholder="press-brake" required />
                </Field>
                <Field label="Group">
                  <Select value={newCat.groupId} onChange={(e) => setNewCat((v) => ({ ...v, groupId: e.target.value }))}>
                    <option value="">No group</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </Select>
                </Field>
                <Field label="Description">
                  <Textarea rows={2} value={newCat.description} onChange={(e) => setNewCat((v) => ({ ...v, description: e.target.value }))} />
                </Field>
                <Button type="submit" disabled={addingCat || !newCat.name.trim() || !newCat.slug.trim()}>
                  {addingCat ? 'Adding...' : 'Add category'}
                </Button>
              </form>
            )}

            <ul className="space-y-1">
              {allCats.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      setSelectedCatId(cat.id === selectedCatId ? null : cat.id);
                      setShowSubForm(false);
                      setShowFieldForm(false);
                    }}
                    className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      cat.id === selectedCatId
                        ? 'bg-forest text-white'
                        : 'hover:bg-navy/[.04] text-ink'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{cat.name}</p>
                      <p className={`text-[11px] ${cat.id === selectedCatId ? 'text-white/65' : 'text-muted'}`}>
                        {cat.group?.name ?? 'No group'}
                        {' · '}
                        {cat._count?.listings ?? 0} listings
                        {' · '}
                        {cat.subcategories?.length ?? 0} subcats
                        {!cat.isActive && ' · inactive'}
                      </p>
                    </div>
                    <ChevronRightIcon className={`h-3.5 w-3.5 flex-shrink-0 ${cat.id === selectedCatId ? 'text-white/70' : 'text-muted group-hover:text-ink'}`} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* â"€â"€ Right panel â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
        {selectedCat ? (
          <div className="space-y-5">

            {/* Category header + controls */}
            <Card>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-ink">{selectedCat.name}</h2>
                  {selectedCat.description && (
                    <p className="mt-0.5 text-sm text-muted">{selectedCat.description}</p>
                  )}
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    slug: {selectedCat.slug}
                    {' · '}
                    <span className="text-copper font-semibold">{selectedCat._count?.listings ?? 0} listings</span>
                    {' · '}
                    {selectedCat.subcategories?.length ?? 0} subcategories
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => void handleToggleCatActive(selectedCat)}
                    className="!py-1.5 text-xs"
                  >
                    {selectedCat.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => void handleDeleteCategory(selectedCat)}
                    disabled={deletingCatId === selectedCat.id}
                    className="!py-1.5 text-xs"
                  >
                    {deletingCatId === selectedCat.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>

              {/* Category image */}
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Category image</p>
                <div className="flex items-center gap-4">
                  {selectedCat.imageUrl ? (
                    <img
                      src={selectedCat.imageUrl}
                      alt={selectedCat.name}
                      className="h-16 w-24 rounded-lg object-cover border border-line"
                    />
                  ) : (
                    <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-line bg-navy/[.02]">
                      <span className="text-[11px] text-muted">No image</span>
                    </div>
                  )}
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => catImageRef.current?.click()}
                      disabled={uploadingCatImage}
                      className="!py-1.5 text-xs flex items-center gap-1.5"
                    >
                      <UploadIcon className="h-3.5 w-3.5" />
                      {uploadingCatImage ? 'Uploading...' : 'Upload image'}
                    </Button>
                    <input
                      ref={catImageRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => void handleUploadCategoryImage(e)}
                    />
                    <p className="mt-1 text-[11px] text-muted">JPG, PNG, WebP — shown in browse grid</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* â"€â"€ Subcategories â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink">
                  Subcategories <span className="font-mono text-[11px] text-muted">({selectedCat.subcategories?.length ?? 0})</span>
                </h3>
                <button
                  onClick={() => setShowSubForm((v) => !v)}
                  className="flex items-center gap-1 text-xs font-semibold text-forest hover:text-forest-2 transition"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  {showSubForm ? 'Cancel' : 'Add subcategory'}
                </button>
              </div>

              {showSubForm && (
                <form onSubmit={(e) => void handleAddSubcategory(e)} className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-line bg-navy/[.02] p-4">
                  <h4 className="col-span-2 text-xs font-bold uppercase tracking-wide text-muted">New subcategory</h4>
                  <Field label="Name">
                    <Input
                      value={newSub.name}
                      onChange={(e) => setNewSub((v) => ({
                        ...v,
                        name: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                      }))}
                      placeholder="CNC Turning Centres"
                      required
                    />
                  </Field>
                  <Field label="Slug" hint="Auto-filled">
                    <Input value={newSub.slug} onChange={(e) => setNewSub((v) => ({ ...v, slug: e.target.value }))} placeholder="cnc-turning-centres" required />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Description">
                      <Textarea rows={2} value={newSub.description} onChange={(e) => setNewSub((v) => ({ ...v, description: e.target.value }))} />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Button type="submit" disabled={addingSub || !newSub.name.trim() || !newSub.slug.trim()}>
                      {addingSub ? 'Adding...' : 'Add subcategory'}
                    </Button>
                  </div>
                </form>
              )}

              {(selectedCat.subcategories?.length ?? 0) === 0 ? (
                <p className="rounded-lg border border-dashed border-line py-6 text-center text-sm text-muted">
                  No subcategories yet.
                </p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line overflow-hidden">
                  {selectedCat.subcategories?.map((sub) => (
                    <li key={sub.id} className={`flex items-center gap-3 px-4 py-3 ${!sub.isActive ? 'opacity-50' : ''}`}>
                      {/* Image */}
                      <div className="flex-shrink-0">
                        {sub.imageUrl ? (
                          <img src={sub.imageUrl} alt={sub.name} className="h-9 w-12 rounded object-cover border border-line" />
                        ) : (
                          <div className="flex h-9 w-12 items-center justify-center rounded border border-dashed border-line bg-navy/[.02]">
                            <span className="text-[9px] text-muted">No img</span>
                          </div>
                        )}
                      </div>

                      {/* Name + slug */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink leading-tight">{sub.name}</p>
                        <p className="font-mono text-[11px] text-muted">{sub.slug}</p>
                      </div>

                      {/* Status badge */}
                      {!sub.isActive && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">inactive</span>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Image upload */}
                        <button
                          onClick={() => subImageRefs.current[sub.id]?.click()}
                          disabled={uploadingSubImageId === sub.id}
                          className="p-1.5 text-muted hover:text-ink transition"
                          title="Upload image"
                        >
                          {uploadingSubImageId === sub.id
                            ? <span className="text-[10px]">...</span>
                            : <UploadIcon className="h-3.5 w-3.5" />
                          }
                        </button>
                        <input
                          ref={(el) => { subImageRefs.current[sub.id] = el; }}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => void handleUploadSubImage(sub, e)}
                        />

                        {/* Activate/deactivate */}
                        <button
                          onClick={() => void handleToggleSubActive(sub)}
                          className="rounded px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-ink border border-line transition"
                        >
                          {sub.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        {/* Hard delete */}
                        <button
                          onClick={() => void handleDeleteSubcategory(sub)}
                          disabled={deletingSubId === sub.id}
                          className="p-1.5 text-red-400 hover:text-red-600 transition"
                          title="Delete subcategory"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* â"€â"€ Spec fields â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
            <Card>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-ink mb-2">
                  Spec fields <span className="font-mono text-[11px] text-muted">({selectedCat.specFields?.length ?? 0})</span>
                </h3>

                {(selectedCat.specFields?.length ?? 0) === 0 ? (
                  <p className="rounded-lg border border-dashed border-line py-6 text-center text-sm text-muted">
                    No spec fields yet — add one below to make the listing form dynamic for this category.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-line">
                    <table className="w-full text-sm">
                      <thead className="bg-navy/[.03] text-xs font-bold uppercase tracking-wide text-muted">
                        <tr>
                          {['Field key', 'Label', 'Type', 'Unit', 'Required', 'Filterable', ''].map((h) => (
                            <th key={h} className="px-3 py-2.5 text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {selectedCat.specFields?.map((f) => (
                          <tr key={f.id} className="hover:bg-navy/[.02]">
                            <td className="px-3 py-2.5 font-mono text-[12px] text-ink">{f.fieldKey}</td>
                            <td className="px-3 py-2.5 text-ink">{f.fieldLabel}</td>
                            <td className="px-3 py-2.5">
                              <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[11px] font-semibold text-forest">
                                {f.fieldType}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[12px] text-muted">{f.unit ?? '—'}</td>
                            <td className="px-3 py-2.5">
                              {f.isRequired
                                ? <span className="text-[11px] font-bold text-copper">Yes</span>
                                : <span className="text-[11px] text-muted">No</span>}
                            </td>
                            <td className="px-3 py-2.5">
                              {f.isFilterable
                                ? <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">{f.filterType}</span>
                                : <span className="text-[11px] text-muted">No</span>}
                            </td>
                            <td className="px-3 py-2.5">
                              <button
                                onClick={() => void handleDeleteSpecField(f.id, f.fieldLabel)}
                                disabled={deletingFieldId === f.id}
                                className="text-red-400 hover:text-red-600 transition"
                                title={`Remove ${f.fieldLabel}`}
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Add spec field form */}
              <div>
                <button
                  onClick={() => setShowFieldForm((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-2 transition"
                >
                  <PlusIcon className="h-4 w-4" />
                  {showFieldForm ? 'Cancel' : 'Add spec field'}
                </button>

                {showFieldForm && (
                  <form onSubmit={(e) => void handleAddSpecField(e)} className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-line bg-navy/[.02] p-5">
                    <h3 className="col-span-2 text-xs font-bold uppercase tracking-wide text-muted">New spec field</h3>
                    <Field label="Field key" hint="snake_case, e.g. max_rpm">
                      <Input
                        value={newField.fieldKey}
                        onChange={(e) => setNewField((v) => ({ ...v, fieldKey: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                        placeholder="swing_over_bed"
                        required
                      />
                    </Field>
                    <Field label="Field label" hint="Human-readable">
                      <Input
                        value={newField.fieldLabel}
                        onChange={(e) => setNewField((v) => ({ ...v, fieldLabel: e.target.value }))}
                        placeholder="Swing Over Bed"
                        required
                      />
                    </Field>
                    <Field label="Type">
                      <Select
                        value={newField.fieldType}
                        onChange={(e) => setNewField((v) => ({ ...v, fieldType: e.target.value as SpecFieldType }))}
                      >
                        {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </Select>
                    </Field>
                    <Field label="Unit" hint="mm, ton, HP — leave blank if none">
                      <Input
                        value={newField.unit}
                        onChange={(e) => setNewField((v) => ({ ...v, unit: e.target.value }))}
                        placeholder="mm"
                      />
                    </Field>
                    {newField.fieldType === 'select' && (
                      <div className="col-span-2">
                        <Field label="Options" hint="Comma-separated, e.g. Horizontal,Vertical">
                          <Input
                            value={newField.options}
                            onChange={(e) => setNewField((v) => ({ ...v, options: e.target.value }))}
                            placeholder="Horizontal, Vertical"
                          />
                        </Field>
                      </div>
                    )}
                    <div className="flex items-center gap-5">
                      <label className="flex items-center gap-2 text-sm font-medium text-ink">
                        <input
                          type="checkbox"
                          checked={newField.isRequired}
                          onChange={(e) => setNewField((v) => ({ ...v, isRequired: e.target.checked }))}
                          className="h-4 w-4 rounded border-line text-forest focus:ring-forest/30"
                        />
                        Required
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium text-ink">
                        <input
                          type="checkbox"
                          checked={newField.isFilterable}
                          onChange={(e) => setNewField((v) => ({ ...v, isFilterable: e.target.checked }))}
                          className="h-4 w-4 rounded border-line text-forest focus:ring-forest/30"
                        />
                        Filterable
                      </label>
                    </div>
                    {newField.isFilterable && (
                      <Field label="Filter type">
                        <Select
                          value={newField.filterType}
                          onChange={(e) => setNewField((v) => ({ ...v, filterType: e.target.value as SpecFilterType }))}
                        >
                          {FILTER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </Select>
                      </Field>
                    )}
                    <div className="col-span-2">
                      <Field label="Help text" hint="Optional tooltip shown in the listing form">
                        <Input
                          value={newField.helpText}
                          onChange={(e) => setNewField((v) => ({ ...v, helpText: e.target.value }))}
                          placeholder="Measure from bed surface to top of workpiece"
                        />
                      </Field>
                    </div>
                    <div className="col-span-2">
                      <Button type="submit" disabled={addingField || !newField.fieldKey.trim() || !newField.fieldLabel.trim()}>
                        {addingField ? 'Adding...' : 'Add field'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-line">
            <p className="text-sm text-muted">Select a category on the left to manage its subcategories and spec fields.</p>
          </div>
        )}
      </div>
    </div>
  );
}
