import { useChannelsList } from "@saleor/channels/queries";
import {
  createShippingChannels,
  createSortedShippingChannels
} from "@saleor/channels/utils";
import ChannelsAvailabilityDialog from "@saleor/components/ChannelsAvailabilityDialog";
import { WindowTitle } from "@saleor/components/WindowTitle";
import useChannels from "@saleor/hooks/useChannels";
import useNavigator from "@saleor/hooks/useNavigator";
import { sectionNames } from "@saleor/intl";
import ShippingZonePostalCodeRangeDialog from "@saleor/shipping/components/ShippingZonePostalCodeRangeDialog";
import ShippingZoneRatesCreatePage from "@saleor/shipping/components/ShippingZoneRatesCreatePage";
import { useShippingRateCreator } from "@saleor/shipping/handlers";
import {
  ShippingRateCreateUrlDialog,
  ShippingRateCreateUrlQueryParams,
  shippingWeightRatesUrl,
  shippingZoneUrl
} from "@saleor/shipping/urls";
import filterPostalCodes from "@saleor/shipping/views/utils";
import { MinMax } from "@saleor/types";
import {
  PostalCodeRuleInclusionTypeEnum,
  ShippingMethodTypeEnum
} from "@saleor/types/globalTypes";
import createDialogActionHandlers from "@saleor/utils/handlers/dialogActionHandlers";
import React from "react";
import { useIntl } from "react-intl";

export interface WeightRatesCreateProps {
  id: string;
  params: ShippingRateCreateUrlQueryParams;
}

export const WeightRatesCreate: React.FC<WeightRatesCreateProps> = ({
  id,
  params
}) => {
  const navigate = useNavigator();
  const intl = useIntl();

  const [postalCodes, setPostalCodes] = React.useState([]);
  const [radioInclusionType, setRadioInclusionType] = React.useState(
    PostalCodeRuleInclusionTypeEnum.EXCLUDE
  );

  const { data: channelsData, loading: channelsLoading } = useChannelsList({});

  const [openModal, closeModal] = createDialogActionHandlers<
    ShippingRateCreateUrlDialog,
    ShippingRateCreateUrlQueryParams
  >(navigate, params => shippingWeightRatesUrl(id, params), params);

  const shippingChannels = createShippingChannels(channelsData?.channels);
  const allChannels = createSortedShippingChannels(channelsData?.channels);

  const {
    channelListElements,
    channelsToggle,
    currentChannels,
    handleChannelsConfirm,
    handleChannelsModalClose,
    handleChannelsModalOpen,
    isChannelSelected,
    isChannelsModalOpen,
    setCurrentChannels,
    toggleAllChannels
  } = useChannels(shippingChannels, params?.action, { closeModal, openModal });

  const {
    channelErrors,
    createShippingRate,
    errors,
    status
  } = useShippingRateCreator(
    id,
    ShippingMethodTypeEnum.WEIGHT,
    postalCodes,
    radioInclusionType
  );

  const handleBack = () => navigate(shippingZoneUrl(id));

  const handlePostalCodeRangeAdd = (data: MinMax) => {
    setPostalCodes(postalCodes => [
      ...postalCodes,
      {
        __typename: "ShippingMethodPostalCodeRule",
        end: data.max,
        id: postalCodes.length.toString(),
        inclusionType: postalCodes?.[0]?.inclusionType,
        start: data.min
      }
    ]);
    closeModal();
  };

  const onPostalCodeInclusionChange = (
    inclusion: PostalCodeRuleInclusionTypeEnum
  ) => {
    setRadioInclusionType(inclusion);
    setPostalCodes([]);
  };

  const onPostalCodeUnassign = code => {
    setPostalCodes(filterPostalCodes(postalCodes, code));
    closeModal();
  };

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.shipping)} />
      {!!allChannels?.length && (
        <ChannelsAvailabilityDialog
          isSelected={isChannelSelected}
          disabled={!channelListElements.length}
          channels={allChannels}
          onChange={channelsToggle}
          onClose={handleChannelsModalClose}
          open={isChannelsModalOpen}
          title={intl.formatMessage({
            defaultMessage: "Manage Channels Availability"
          })}
          confirmButtonState="default"
          selected={channelListElements.length}
          onConfirm={handleChannelsConfirm}
          toggleAll={toggleAllChannels}
        />
      )}
      <ShippingZoneRatesCreatePage
        allChannelsCount={allChannels?.length}
        shippingChannels={currentChannels}
        disabled={channelsLoading || status === "loading"}
        saveButtonBarState={status}
        onSubmit={createShippingRate}
        onBack={handleBack}
        errors={errors}
        channelErrors={channelErrors}
        postalCodes={postalCodes}
        openChannelsModal={handleChannelsModalOpen}
        onChannelsChange={setCurrentChannels}
        onPostalCodeAssign={() => openModal("add-range")}
        onPostalCodeUnassign={onPostalCodeUnassign}
        onPostalCodeInclusionChange={onPostalCodeInclusionChange}
        variant={ShippingMethodTypeEnum.WEIGHT}
      />
      <ShippingZonePostalCodeRangeDialog
        confirmButtonState="default"
        onClose={closeModal}
        onSubmit={handlePostalCodeRangeAdd}
        open={params.action === "add-range"}
      />
    </>
  );
};

export default WeightRatesCreate;
