import { FC, Fragment, useMemo, ReactElement } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Button, Switch, TextField, camelCaseToSpaces } from '@takaro/lib-components';
import { Settings, PERMISSIONS } from '@takaro/apiclient';
import { useGlobalGameServerSettings, useSetGlobalSetting } from 'queries/settings';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDocumentTitle } from 'hooks/useDocumentTitle';
import { useSnackbar } from 'notistack';
import { useHasPermission } from 'components/PermissionsGuard';

export function dirtyValues(dirtyFields: object | boolean, allValues: object): object {
  // If *any* item in an array was modified, the entire array must be submitted, because there's no way to indicate
  // "placeholders" for unchanged elements. `dirtyFields` is `true` for leaves.
  if (dirtyFields === true || Array.isArray(dirtyFields)) return allValues;
  // Here, we have an object
  return Object.fromEntries(
    Object.keys(dirtyFields).map((key) => [key, dirtyValues(dirtyFields[key], allValues[key])])
  );
}

interface IFormInputs {
  commandPrefix: string;
  serverChatName: string;
  economyEnabled: boolean;
  currencyName: string;
}

export const booleanFields = ['economyEnabled'];

export function mapSettings<T extends Promise<unknown>>(
  data: Settings,
  fn: (key: keyof IFormInputs, value?: string) => T
) {
  const promises: Promise<unknown>[] = [];
  for (const key in data) {
    const settingsKey = key as keyof IFormInputs;
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const element = data[key];
      promises.push(fn(settingsKey, element));
    }
  }
  return Promise.all(promises);
}

export const GlobalGameServerSettings: FC = () => {
  useDocumentTitle('Settings');
  const { enqueueSnackbar } = useSnackbar();
  const { mutateAsync: setGlobalSetting } = useSetGlobalSetting();
  const { data, isLoading: isLoadingSettings } = useGlobalGameServerSettings();
  const { isLoading: isLoadingPermission, hasPermission } = useHasPermission([PERMISSIONS.ManageSettings]);

  if (isLoadingPermission) return <div>Loading...</div>;

  const readOnly = !hasPermission;

  const validationSchema = useMemo(() => {
    if (data) {
      const res = data.reduce((acc, { key }) => {
        booleanFields.includes(key) ? (acc[key] = z.boolean()) : (acc[key] = z.string());
        return acc;
      }, {});
      return z.object(res);
    }

    return z.object({});
  }, [data]);

  const { control, handleSubmit, setValue, formState, reset } = useForm<IFormInputs>({
    mode: 'onSubmit',
    resolver: zodResolver(validationSchema),
  });

  const onSubmit: SubmitHandler<IFormInputs> = async (values) => {
    const changedFields = dirtyValues(formState.dirtyFields, values) as Settings;

    try {
      await mapSettings(changedFields, async (key, value) => {
        if (typeof value === 'boolean') {
          return await setGlobalSetting({ key, value: value ? 'true' : 'false' });
        }
        return await setGlobalSetting({ key, value: value as string });
      });

      enqueueSnackbar('Settings has been successfully saved', { variant: 'default' });
      reset({}, { keepValues: true });
    } catch (error) {
      enqueueSnackbar('An error occurred while saving settings', { variant: 'default', type: 'error' });
      return;
    }
  };

  const settings = useMemo(() => {
    const settingsComponents: ReactElement[] = [];
    if (data) {
      // TODO: this should be mapped using the new config generator
      data.forEach(({ key, value }) => {
        if (booleanFields.includes(key)) {
          settingsComponents.push(
            <Switch readOnly={readOnly} control={control} label={camelCaseToSpaces(key)} name={key} key={key} />
          );
          setValue(key, value === 'true');
        } else {
          settingsComponents.push(
            <TextField readOnly={readOnly} control={control} label={camelCaseToSpaces(key)} name={key} key={key} />
          );
          if (value) setValue(key, value);
        }
      });
    }

    return settingsComponents;
  }, [data]);

  return (
    <Fragment>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fragment>
          {settings}
          {!readOnly && (
            <Button
              disabled={!formState.isDirty}
              isLoading={isLoadingSettings}
              text="Save settings"
              type="submit"
              variant="default"
            />
          )}
        </Fragment>
      </form>
    </Fragment>
  );
};
