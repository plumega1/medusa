import { PencilSquare } from "@medusajs/icons"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"

export const ColorPicker = () => {
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Color Picker</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Manage your store&apos;s color settings
          </Text>
        </div>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: "colors/edit",
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.name")}
        </Text>
        <Text size="small" leading="compact">
          {/* {store.name} */}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("store.defaultCurrency")}
        </Text>

        <div className="flex items-center gap-x-2">
          <Badge size="2xsmall">
            {/* {defaultCurrency.currency_code?.toUpperCase()} */}
          </Badge>
          <Text size="small" leading="compact">
            {/* {defaultCurrency.currency?.name} */}
          </Text>
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("store.defaultRegion")}
        </Text>
        <div className="flex items-center gap-x-2">
          <Badge size="2xsmall" asChild>
            {/* {region.name} */}
          </Badge>
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("store.defaultSalesChannel")}
        </Text>
        <div className="flex items-center gap-x-2">
          <Badge size="2xsmall" asChild>
            {/* {sales_channel.name} */}
          </Badge>
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("store.defaultLocation")}
        </Text>
        <div className="flex items-center gap-x-2">
          <Badge size="2xsmall" asChild>
            {/* {stock_location.name} */}
          </Badge>
        </div>
      </div>
    </Container>
  )
}
