import React, { useMemo } from 'react';
import { useState } from 'react';
// import { useForm } from 'react-hook-form';
import { Meta, StoryFn } from '@storybook/react';

import {
  Drawer,
  DrawerContent,
  DrawerBody,
  DrawerHeading,
  DrawerFooter,
} from '.';
import {
  Button,
  TextField,
  CollapseList,
  Chip,
  RadioGroup,
  Switch,
} from '../../../components';
import { styled } from '../../../styled';
import { SubmitHandler, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useValidationSchema } from '../../../hooks';

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
`;
const Status = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export default {
  title: 'data/Drawer',
  component: Drawer,
} as Meta;

interface FormFields {
  name: string;
  description: string;
  priceType: 'fixed' | 'variable';
  generateLicenseKeys: boolean;
  redirectAfterPurchase: boolean;
  onStoreFront: boolean;
}

export const Default: StoryFn = () => {
  const [open, setOpen] = useState<boolean>(false);

  const validationSchema = useMemo(
    () =>
      yup.object({
        name: yup.string().required('Name is a required field.'),
        description: yup
          .string()
          .required('Password is a required field.')
          .min(20, 'description must be at least 20 characters'),
        priceType: yup.mixed().oneOf(['fixed', 'variable']),
      }),
    []
  );

  const { handleSubmit, control } = useForm<FormFields>({
    resolver: useValidationSchema(validationSchema),
  });

  // this should be typed ofcourse
  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    console.log(data);
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} text="Open drawer" />
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeading>Product Details</DrawerHeading>
          <DrawerBody>
            <Status>
              Status: <Chip label="active" color="success" variant="outline" />
            </Status>
            <form id="myform" onSubmit={handleSubmit(onSubmit)}>
              <CollapseList>
                <CollapseList.Item title="General">
                  <TextField
                    label="Name"
                    name="name"
                    required
                    control={control}
                    description={
                      'Give your product a short and clear name.\n50-60 characters is the recommended length for search engines.'
                    }
                  />
                  <TextField
                    label="Description"
                    name="description"
                    required
                    control={control}
                    description="Give your product a short and clear description. 120-160 characters is the recommended length for search engines"
                  />
                </CollapseList.Item>
                <CollapseList.Item title="Pricing">
                  <RadioGroup
                    control={control}
                    label="Selection a price type"
                    name="priceType"
                    options={[
                      { label: 'Fixed', labelPosition: 'left', value: 'fixed' },
                      {
                        label: 'Variable',
                        labelPosition: 'left',
                        value: 'variable',
                      },
                    ]}
                  />
                </CollapseList.Item>
              </CollapseList>
              <CollapseList.Item title="Settings">
                <Switch
                  control={control}
                  label="Generate License Keys"
                  name="generateLicenseKeys"
                  size="tiny"
                  description="Issue each sutomer a unique license key after purchase"
                />
                <Switch
                  control={control}
                  label="Redirect customers after purchase"
                  name="redirectAfterPurchase"
                  size="small"
                  description="Redirect customers to a custom URL after making a purchase"
                />
                <Switch
                  control={control}
                  label="Display product on storefront?"
                  name="onStoreFront"
                  description="Show this product on your storefront"
                  size="small"
                />
              </CollapseList.Item>
            </form>
          </DrawerBody>
          <DrawerFooter>
            <ButtonContainer>
              <Button
                text="Cancel"
                onClick={() => setOpen(false)}
                color="background"
              />
              <Button
                fullWidth
                text="Save changes"
                type="submit"
                form="myform"
              />
            </ButtonContainer>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};
