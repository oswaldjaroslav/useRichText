import React, { useCallback, FunctionComponent, useRef } from 'react';

type TRichSItem = string | JSX.Element;

type TContainers<T extends string | symbol | number> = Record<T, FunctionComponent>;
interface IUseRichStringRenderer<T extends string | symbol | number> {
  containers: TContainers<T>;
  mainContainer?: JSX.Element;
}

type TGetContainer<T extends string | symbol | number> = (key: T) => FunctionComponent | undefined;

function createElementWithContainer(content: string, Container?: FunctionComponent) {
  if (!Container) {
    return content;
  }
  return <Container>{content}</Container>;
}

function getEnhancedValue<T extends string | symbol | number>(str: string, tag: T, getContainer: TGetContainer<T>) {
  const startTag = `<${tag}>`;
  const endTag = `</${tag}>`;
  const Container = getContainer(tag);

  const replaceTags = (str: string) => {
    return str.replace(startTag, '').replace(endTag, '');
  };

  const traverseString = (result: TRichSItem[] = [], currentString: string): TRichSItem[] => {
    if (!currentString || !currentString.trim().length) {
      return result;
    }
    const start = currentString.indexOf(startTag);
    const end = currentString.indexOf(endTag) + startTag.length + 1;
    if (start < 0) {
      return [...result, createElementWithContainer(currentString)];
    }
    if (start > 0) {
      const str = currentString.substring(0, start);
      const nextRes = [...result, createElementWithContainer(str)];
      const nextStr = currentString.replace(str, '');
      return traverseString(nextRes, nextStr);
    }
    const str = currentString.substring(start, end);
    const nextStr = currentString.replace(str, '');
    const nextRes = [...result, createElementWithContainer(replaceTags(str), Container)];
    return traverseString(nextRes, nextStr);
  };
  return traverseString([], str);
}

function useRichStringRenderer<T extends string | symbol | number>(params: IUseRichStringRenderer<T>) {
  const transformedValues = useRef<Record<string, (string | JSX.Element)[]>>({});

  const setTransformedValue = (key: string, value: (string | JSX.Element)[]) => {
    transformedValues.current = {
      ...transformedValues.current,
      [key]: value,
    };
  };

  const getTransformedValue = (value: string): (string | JSX.Element)[] | undefined => {
    if (transformedValues.current) {
      return transformedValues.current[value];
    }
  };

  const getContainer: TGetContainer<T> = useCallback(key => params.containers[key], [params.containers]);

  const getRichStringArray = useCallback(
    (key: string) => {
      const savedValue = getTransformedValue(key);
      if (savedValue) {
        return savedValue;
      }
      const tag = Object.keys(params.containers)[0] as T;
      const newValue = getEnhancedValue(key, tag, getContainer);
      setTransformedValue(key, newValue);
      return newValue;
    },
    [getContainer, params.containers]
  );

  const renderRichString = useCallback(
    (value: string) => {
      const children = getRichStringArray(value);
      if (params.mainContainer) {
        return React.cloneElement(params.mainContainer, { children });
      }
      return <>{children}</>;
    },
    [params.mainContainer, getRichStringArray]
  );

  return {
    renderRichString,
  };
}

export default useRichStringRenderer;
