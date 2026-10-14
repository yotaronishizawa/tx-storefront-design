import { smartShelvesStatus } from "../model/smart-shelves.mjs"
import { withErrors } from "./define.mjs"
import { SMART_SHELVES_STATUS_ERRORS } from "./errors.mjs"

// `SmartShelves/RpcGateway.CabinetStatusSubscription.cs:133,145`: a blank
// storeId answers `success: false`.
const subscription = ([request]) => ({
  success: Boolean(String(request?.storeId ?? "").trim()),
})

export const smartShelvesMethods = {
  // `RpcResult<SmartShelvesStatus>` (`Entities/RpcResult.cs`).
  GetSmartShelvesStatus: withErrors(
    ([storeId]) => ({
      error: null,
      isSuccess: true,
      data: smartShelvesStatus(String(storeId ?? "")),
    }),
    SMART_SHELVES_STATUS_ERRORS,
    () => ({
      error: {
        message: {
          eng: "Unable to get smart shelves status",
          jpn: "スマートシェルフの状態を取得できません",
        },
      },
      isSuccess: false,
      data: null,
    })
  ),
  // The topic itself is joined with the hub's `Subscribe`; these only acknowledge.
  SubscribeToSmartShelvesStatus: subscription,
  UnsubscribeToSmartShelvesStatus: subscription,
}
