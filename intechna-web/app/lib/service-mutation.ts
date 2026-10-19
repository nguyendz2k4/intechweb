import { ApiError, readJsonObject } from './api-security'
import { serviceInput } from './cms-input'
import type { Service } from './db/schema'

type ServiceInput = ReturnType<typeof serviceInput>
export type ServiceRepository = {
  createService: (input: ServiceInput) => Promise<Service | null>
  upsertService: (input: ServiceInput) => Promise<Service>
}

/** Creating never replaces a CMS row; PUT can create an override for a static service. */
export async function saveServiceContent(
  request: Request,
  repository: ServiceRepository | (() => Promise<ServiceRepository>),
) {
  const updating = request.method === 'PUT'
  if (!updating && request.method !== 'POST') throw new ApiError('Thao tác không hợp lệ.', 405)
  const input = serviceInput(await readJsonObject(request, 128 * 1024), updating)
  const storage = typeof repository === 'function' ? await repository() : repository
  const service = await (updating ? storage.upsertService(input) : storage.createService(input))
  if (!service) throw new ApiError('Đường dẫn dịch vụ đã tồn tại.', 409)
  return { service, status: updating ? 200 : 201 }
}
